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

// --- Validation Schema ---
const VoucherSchema = z.object({
  date: z.string(),
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
});

// --- Helper: Get Logged In User ---
async function getCurrentUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey);
    return parseInt(payload.userId as string);
  } catch (e) {
    return null;
  }
}

// ==========================================
// 1. CREATE VOUCHER
// ==========================================
export async function createVoucher(prevState: any, formData: FormData) {
  const result = VoucherSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
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
  } = result.data;
  const cid = parseInt(companyId);
  const userId = await getCurrentUserId();

  if (!userId) return { error: "User not authenticated" };

  const isInventoryVoucher =
    (type === "SALES" || type === "PURCHASE") && inventoryRows;

  // Validation for Accounting Vouchers
  if (rows && !isInventoryVoucher) {
    const entries = JSON.parse(rows);
    let totalDr = 0,
      totalCr = 0;
    entries.forEach((e: any) => {
      const amt = parseFloat(e.amount);
      if (e.type === "Dr") totalDr += amt;
      else totalCr += amt;
    });
    if (Math.abs(totalDr - totalCr) > 0.01) {
      return {
        error: `Mismatch! Dr: ${totalDr.toFixed(2)} vs Cr: ${totalCr.toFixed(
          2
        )}`,
      };
    }
  }

  // GENERATE 5-DIGIT BANK CODE
  const transactionCode = Math.floor(10000 + Math.random() * 90000).toString();

  try {
    await prisma.$transaction(async (tx) => {
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

      // C. Inventory Logic
      if (isInventoryVoucher && inventoryRows) {
        const items = JSON.parse(inventoryRows);
        let totalAmount = 0;

        for (const item of items) {
          const qty = parseFloat(item.qty);
          const rate = parseFloat(item.rate);
          const amt = qty * rate;
          totalAmount += amt;

          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              itemId: parseInt(item.itemId),
              quantity: type === "SALES" ? -qty : qty,
              rate: rate,
              amount: amt,
            },
          });
        }

        // Auto-Post to Ledgers
        if (!partyLedgerId || !salesPurchaseLedgerId)
          throw new Error("Missing Ledgers");
        const partyId = parseInt(partyLedgerId);
        const accountId = parseInt(salesPurchaseLedgerId);

        if (type === "SALES") {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: totalAmount,
            },
          });
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: -totalAmount,
            },
          });
        } else {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: -totalAmount,
            },
          });
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: totalAmount,
            },
          });
        }
      } else if (rows) {
        // D. Standard Accounting Logic
        const entries = JSON.parse(rows);
        for (const entry of entries) {
          const val = parseFloat(entry.amount);
          const dbAmount = entry.type === "Dr" ? val : -val;

          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: parseInt(entry.ledgerId),
              amount: dbAmount,
            },
          });
        }
      }
    });

    return { success: true, code: transactionCode };
  } catch (e) {
    console.error(e);
    return { error: "Failed to save voucher. Database error." };
  }
}

// ==========================================
// 2. FETCH VOUCHER BY CODE (FIXED)
// ==========================================
export async function getVoucherByCode(code: string, companyId: number) {
  const voucher = await prisma.voucher.findFirst({
    where: {
      transactionCode: code,
      companyId: companyId,
    },
    include: {
      entries: { include: { ledger: true } },
      inventory: true, // ✅ FIXED: Matches your Schema name 'inventory'
      createdBy: true,
    },
  });
  return voucher;
}

// ==========================================
// 3. VERIFY VOUCHER ACTION
// ==========================================
export async function verifyVoucherAction(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) return { error: "Voucher not found" };

    if (voucher.createdById === userId) {
      return { error: "Maker cannot act as Checker for own entry." };
    }

    await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        status: "APPROVED",
        verifiedById: userId,
      },
    });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Verification Failed" };
  }
}

// ==========================================
// 4. ALIAS EXPORT (Prevents 'verifyVoucher not found' error)
// ==========================================
export const verifyVoucher = verifyVoucherAction;

// ==========================================
// 5. DELETE VOUCHER
// ==========================================
export async function deleteVoucher(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) return { error: "Voucher not found" };

    // Note: Prisma usually handles cascade delete, but we delete manually to be safe if cascade isn't set in DB
    await prisma.inventoryEntry.deleteMany({ where: { voucherId } });
    await prisma.voucherEntry.deleteMany({ where: { voucherId } });
    await prisma.voucher.delete({ where: { id: voucherId } });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete voucher" };
  }
}
