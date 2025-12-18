"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- Validation Schemas ---
const AccountRowSchema = z.object({
  ledgerId: z.string().min(1, "Ledger ID is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["Dr", "Cr"]),
});

const InventoryRowSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  qty: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  gst: z.coerce.number().optional().default(0),
});

const VoucherSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum([
    "CONTRA",
    "PAYMENT",
    "RECEIPT",
    "JOURNAL",
    "SALES",
    "PURCHASE",
  ]),
  narration: z.string().optional(),
  companyId: z.string(),
  rows: z.string().optional(),
  inventoryRows: z.string().optional(),
  partyLedgerId: z.string().optional(),
  salesPurchaseLedgerId: z.string().optional(),
  taxLedgerId: z.string().optional(),
});

// --- Helper: Get User (Cleaned up and Awaited) ---
async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies(); // Next.js 15+ requirement
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const { payload } = await jwtVerify(session, encodedKey);
    // Handle both string and number payloads
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

// ==========================================
// 1. CREATE VOUCHER
// ==========================================
export async function createVoucher(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = VoucherSchema.safeParse(data);

  if (!result.success) {
    console.error("Validation Error:", result.error.issues);
    return { error: result.error.issues[0].message };
  }

  const {
    date,
    type,
    narration,
    companyId,
    rows,
    inventoryRows,
    partyLedgerId,
    salesPurchaseLedgerId,
    taxLedgerId,
  } = result.data;

  const cid = parseInt(companyId);
  const userId = await getCurrentUserId();
  if (!userId) return { error: "User not authenticated or session expired." };

  const transactionCode = Math.floor(10000 + Math.random() * 90000).toString();

  try {
    const newVoucher = await prisma.$transaction(async (tx) => {
      // A. Auto-Numbering
      let sequence = await tx.voucherSequence.findUnique({
        where: { companyId_voucherType: { companyId: cid, voucherType: type } },
      });

      if (!sequence) {
        sequence = await tx.voucherSequence.create({
          data: { companyId: cid, voucherType: type, lastNo: 0 },
        });
      }
      const nextNo = (sequence.lastNo + 1).toString();
      await tx.voucherSequence.update({
        where: { id: sequence.id },
        data: { lastNo: sequence.lastNo + 1 },
      });

      // B. Create Voucher Header
      const voucher = await tx.voucher.create({
        data: {
          date: new Date(date),
          voucherNo: nextNo,
          transactionCode: transactionCode,
          type: type,
          narration,
          companyId: cid,
          status: "PENDING",
          createdById: userId,
        },
      });

      // C. SALES & PURCHASE LOGIC
      if (type === "SALES" || type === "PURCHASE") {
        if (!inventoryRows || !partyLedgerId || !salesPurchaseLedgerId) {
          throw new Error(
            "Validation Error: Missing Inventory or Ledgers for Sales/Purchase."
          );
        }

        const items = z
          .array(InventoryRowSchema)
          .parse(JSON.parse(inventoryRows));
        let totalGoodsValue = 0;
        let totalTaxValue = 0;

        for (const item of items) {
          const itemIdInt = parseInt(item.itemId);
          const stockItem = await tx.stockItem.findUnique({
            where: { id: itemIdInt },
            select: { name: true },
          });

          if (!stockItem)
            throw new Error(`Stock Item ID ${itemIdInt} not found.`);

          const lineAmount = item.qty * item.rate;
          const lineTax = lineAmount * (item.gst / 100);
          totalGoodsValue += lineAmount;
          totalTaxValue += lineTax;

          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              stockItemId: itemIdInt,
              itemName: stockItem.name,
              quantity:
                type === "SALES" ? -Math.abs(item.qty) : Math.abs(item.qty),
              rate: item.rate,
              amount: lineAmount,
            },
          });
        }

        const partyIdInt = parseInt(partyLedgerId);
        const accountIdInt = parseInt(salesPurchaseLedgerId);
        const finalTax = taxLedgerId ? totalTaxValue : 0;
        const grandTotal = totalGoodsValue + finalTax;

        if (type === "SALES") {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyIdInt,
              amount: grandTotal,
            },
          });
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountIdInt,
              amount: -totalGoodsValue,
            },
          });
          if (taxLedgerId) {
            await tx.voucherEntry.create({
              data: {
                voucherId: voucher.id,
                ledgerId: parseInt(taxLedgerId),
                amount: -finalTax,
              },
            });
          }
        } else {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyIdInt,
              amount: -grandTotal,
            },
          });
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountIdInt,
              amount: totalGoodsValue,
            },
          });
          if (taxLedgerId) {
            await tx.voucherEntry.create({
              data: {
                voucherId: voucher.id,
                ledgerId: parseInt(taxLedgerId),
                amount: finalTax,
              },
            });
          }
        }
      }
      // D. STANDARD VOUCHER LOGIC
      else if (rows) {
        const entries = z.array(AccountRowSchema).parse(JSON.parse(rows));
        const totalDr = entries
          .filter((e) => e.type === "Dr")
          .reduce((sum, e) => sum + e.amount, 0);
        const totalCr = entries
          .filter((e) => e.type === "Cr")
          .reduce((sum, e) => sum + e.amount, 0);

        if (Math.abs(totalDr - totalCr) > 0.01) {
          throw new Error(
            "Validation Error: Debit and Credit totals do not match."
          );
        }

        for (const entry of entries) {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: parseInt(entry.ledgerId),
              amount:
                entry.type === "Dr"
                  ? Math.abs(entry.amount)
                  : -Math.abs(entry.amount),
            },
          });
        }
      }
      return voucher;
    });

    revalidatePath(`/companies/${cid}/vouchers`);
    return { success: true, code: transactionCode, id: newVoucher.id };
  } catch (e: any) {
    console.error("Create Voucher Error:", e);
    return {
      error: e.message.startsWith("Validation Error")
        ? e.message
        : "Failed to save voucher.",
    };
  }
}

// ==========================================
// 2. FETCH VOUCHER
// ==========================================
export async function getVoucherByCode(code: string, companyId: number) {
  const standardInclude = {
    entries: { include: { ledger: true } },
    inventory: {
      include: {
        stockItem: { select: { name: true, gstRate: true, unit: true } },
      },
    },
    createdBy: true,
  };

  let voucher = await prisma.voucher.findFirst({
    where: { transactionCode: code, companyId },
    include: standardInclude,
  });

  if (!voucher) {
    voucher = await prisma.voucher.findFirst({
      where: { voucherNo: code, companyId },
      include: standardInclude,
    });
  }

  if (!voucher && !isNaN(Number(code))) {
    const id = parseInt(code);
    voucher = await prisma.voucher.findUnique({
      where: { id },
      include: standardInclude,
    });
    if (voucher?.companyId !== companyId) voucher = null;
  }

  return voucher;
}

// ==========================================
// 3. VERIFY VOUCHER
// ==========================================
export async function verifyVoucherAction(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { inventory: true }, // ✅ Added to check inventory movement
    });

    if (!voucher) return { error: "Voucher not found" };

    if (voucher.createdById === userId) {
      return {
        error:
          "Maker-Checker Conflict: You cannot verify a voucher you created or last edited.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Status
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          status: "APPROVED",
          verifiedById: userId,
          updatedAt: new Date(),
        },
      });

      // 2. ✅ Process Stock Journal Inventory Movement
      if (voucher.type === "STOCK_JOURNAL") {
        for (const item of voucher.inventory) {
          await tx.stockItem.update({
            where: { id: item.stockItemId },
            data: {
              quantity: item.isProduction
                ? { increment: item.quantity }
                : { decrement: item.quantity },
            },
          });
        }
      }
    });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    revalidatePath(`/companies/${voucher.companyId}/inventory`);
    return { success: true };
  } catch (e) {
    console.error("Verification Error:", e);
    return { error: "Verification Failed" };
  }
}

export const verifyVoucher = verifyVoucherAction;

// ==========================================
// 4. DELETE VOUCHER
// ==========================================
export async function deleteVoucher(voucherId: number) {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) return { error: "Voucher not found" };

    await prisma.$transaction(async (tx) => {
      await tx.inventoryEntry.deleteMany({ where: { voucherId } });
      await tx.voucherEntry.deleteMany({ where: { voucherId } });
      await tx.voucher.delete({ where: { id: voucherId } });
    });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Delete Failed." };
  }
}
