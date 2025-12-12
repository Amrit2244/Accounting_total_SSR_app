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
  // Standard Accounting Rows (Journal mode)
  rows: z.string().optional(),
  // Inventory Rows (Item Invoice mode)
  inventoryRows: z.string().optional(),
  partyLedgerId: z.string().optional(),
  salesPurchaseLedgerId: z.string().optional(),
});

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

export async function createVoucher(prevState: any, formData: FormData) {
  const result = VoucherSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };

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

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Auto-Numbering
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

      // 2. Maker-Checker Logic
      const user = await tx.user.findUnique({ where: { id: userId } });
      const status =
        user?.role === "CHECKER" || user?.role === "ADMIN"
          ? "APPROVED"
          : "PENDING";
      const verifierId = status === "APPROVED" ? userId : null;

      // 3. Create Voucher Header
      const voucher = await tx.voucher.create({
        data: {
          date: new Date(date),
          voucherNo: nextNo,
          type,
          narration,
          companyId: cid,
          status,
          createdById: userId,
          verifiedById: verifierId,
        },
      });

      // 4. HANDLE INVENTORY VOUCHER (Sales/Purchase)
      if (isInventoryVoucher) {
        const items = JSON.parse(inventoryRows);
        let totalAmount = 0;

        // Save Inventory Entries
        for (const item of items) {
          const qty = parseFloat(item.qty);
          const rate = parseFloat(item.rate);
          const amt = qty * rate;
          totalAmount += amt;

          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              itemId: parseInt(item.itemId),
              quantity: type === "SALES" ? -qty : qty, // Sales = Out (-), Purchase = In (+)
              rate: rate,
              amount: amt,
            },
          });
        }

        // AUTO-GENERATE LEDGER ENTRIES
        // Sales: Party Dr, Sales Cr
        // Purchase: Party Cr, Purchase Dr

        if (!partyLedgerId || !salesPurchaseLedgerId)
          throw new Error("Missing Ledgers for Invoice");

        const partyId = parseInt(partyLedgerId);
        const accountId = parseInt(salesPurchaseLedgerId);

        if (type === "SALES") {
          // Debit Party (Buyer)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: totalAmount,
            },
          });
          // Credit Sales A/c
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: -totalAmount,
            },
          });
        } else {
          // Credit Party (Seller)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: -totalAmount,
            },
          });
          // Debit Purchase A/c
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: totalAmount,
            },
          });
        }
      }
      // 5. HANDLE NORMAL ACCOUNTING VOUCHER (Journal/Payment/Receipt)
      else if (rows) {
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
  } catch (e) {
    console.error(e);
    return { error: "Failed to save voucher." };
  }

  revalidatePath(`/companies/${cid}/vouchers`);
  redirect(`/companies/${cid}/vouchers`);
}

// Keep verifyVoucher and deleteVoucher as they were...
export async function verifyVoucher(voucherId: number) {
  // ... (Keep existing code from previous step)
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };
  try {
    await prisma.voucher.update({
      where: { id: voucherId },
      data: { status: "APPROVED", verifiedById: userId },
    });
    return { success: true };
  } catch (e) {
    return { error: "Failed" };
  }
}
