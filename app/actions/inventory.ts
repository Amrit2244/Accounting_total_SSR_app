"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- AUTH HELPER ---
async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch (error) {
    return null;
  }
}

// --- CREATE UNIT (NO CHANGES) ---
const UnitSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  companyId: z.string(),
});

export async function createUnit(prevState: any, formData: FormData) {
  const result = UnitSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: "Invalid Data" };

  try {
    await prisma.unit.create({
      data: {
        name: result.data.name,
        symbol: result.data.symbol,
        companyId: parseInt(result.data.companyId),
      },
    });
    revalidatePath(`/companies/${result.data.companyId}/inventory`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to create Unit" };
  }
}

// --- CREATE STOCK ITEM (UPDATED FOR FEATURE 3) ---
const ItemSchema = z.object({
  name: z.string().min(1),
  unitId: z.string().min(1, "Unit is required"),
  partNumber: z.string().optional(),
  openingQty: z.string().optional(),
  openingRate: z.string().optional(),
  minStock: z.string().optional(), // ✅ Added for Reorder Alerts
  companyId: z.string(),
});

export async function createStockItem(prevState: any, formData: FormData) {
  const result = ItemSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };

  const {
    name,
    unitId,
    partNumber,
    openingQty,
    openingRate,
    companyId,
    minStock,
  } = result.data;

  try {
    const qty = parseFloat(openingQty || "0");
    const rate = parseFloat(openingRate || "0");
    const reorderLevel = parseFloat(minStock || "0"); // ✅

    await prisma.stockItem.create({
      data: {
        name,
        unitId: parseInt(unitId),
        partNumber,
        companyId: parseInt(companyId),
        openingQty: qty,
        openingValue: qty * rate,
        quantity: qty,
        minStock: reorderLevel, // ✅ Feature 3: Set minStock
      },
    });
  } catch (e) {
    return { error: "Failed to create Item" };
  }

  redirect(`/companies/${companyId}/inventory`);
}

// ==========================================
// ✅ UPDATED: CREATE STOCK JOURNAL (FEATURE 5: AUDIT LOGS)
// ==========================================

export async function createStockJournal(prevState: any, formData: FormData) {
  const companyId = parseInt(formData.get("companyId") as string);
  const date = new Date(formData.get("date") as string);
  const narration = formData.get("narration") as string;

  const consumptionEntries = JSON.parse(
    (formData.get("consumption") as string) || "[]"
  );
  const productionEntries = JSON.parse(
    (formData.get("production") as string) || "[]"
  );

  if (consumptionEntries.length === 0 && productionEntries.length === 0) {
    return { error: "Voucher must have at least one entry." };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    // Fetch user details for the Audit Log
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };

    const txCode = Math.floor(10000 + Math.random() * 90000).toString();

    await prisma.$transaction(async (tx) => {
      // 1. Create the Voucher Header with PENDING status
      const voucher = await tx.voucher.create({
        data: {
          companyId,
          date,
          type: "STOCK_JOURNAL",
          voucherNo: "SJ-" + Date.now().toString().slice(-4),
          transactionCode: txCode,
          narration,
          status: "PENDING",
          createdById: userId,
          totalAmount: productionEntries.reduce(
            (sum: number, p: any) => sum + Number(p.qty) * Number(p.rate),
            0
          ),
        },
      });

      // 2. Create Consumption Entries
      for (const item of consumptionEntries) {
        await tx.inventoryEntry.create({
          data: {
            voucherId: voucher.id,
            stockItemId: Number(item.sid),
            itemName: item.name,
            quantity: Number(item.qty),
            rate: Number(item.rate),
            amount: Number(item.qty) * Number(item.rate),
            isProduction: false,
          },
        });
      }

      // 3. Create Production Entries
      for (const item of productionEntries) {
        await tx.inventoryEntry.create({
          data: {
            voucherId: voucher.id,
            stockItemId: Number(item.sid),
            itemName: item.name,
            quantity: Number(item.qty),
            rate: Number(item.rate),
            amount: Number(item.qty) * Number(item.rate),
            isProduction: true,
          },
        });
      }

      // ✅ 4. FEATURE 5: RECORD AUDIT LOG
      await tx.auditLog.create({
        data: {
          voucherId: voucher.id,
          userId: userId,
          userName: user.name,
          action: "CREATED",
          details: `Stock Journal #${txCode} created. Consumption items: ${consumptionEntries.length}, Production items: ${productionEntries.length}.`,
        },
      });
    });

    revalidatePath(`/companies/${companyId}/inventory`);
    revalidatePath(`/companies/${companyId}/vouchers`);

    return {
      success: true,
      message: `Stock Journal ${txCode} submitted successfully and is awaiting verification.`,
    };
  } catch (error: any) {
    console.error("Stock Journal Error:", error);
    return { error: "Failed to submit stock journal: " + error.message };
  }
}
