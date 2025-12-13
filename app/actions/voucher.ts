"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  taxLedgerId: z.string().optional(), // ✅ NEW: Tax Ledger ID
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
    taxLedgerId, // ✅ Extract Tax Ledger
  } = result.data;

  const cid = parseInt(companyId);
  const userId = await getCurrentUserId();

  if (!userId) return { error: "User not authenticated" };

  const isInventoryVoucher =
    (type === "SALES" || type === "PURCHASE") && inventoryRows;

  // Validation for Standard Accounting Vouchers (Journal, Payment, etc.)
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
    const newVoucher = await prisma.$transaction(async (tx) => {
      // A. Auto-Numbering Logic
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

      // C. Inventory & Tax Logic (SALES / PURCHASE)
      if (isInventoryVoucher && inventoryRows) {
        const items = JSON.parse(inventoryRows);
        let itemTotal = 0; // Pure Goods Value
        let taxTotal = 0; // Tax Value

        for (const item of items) {
          const qty = parseFloat(item.qty);
          const rate = parseFloat(item.rate);

          // Calculate Line Amount and Tax
          const lineAmount = qty * rate;
          const gstRate = parseFloat(item.gst || "0"); // Get GST% from row
          const lineTax = lineAmount * (gstRate / 100);

          itemTotal += lineAmount;
          taxTotal += lineTax;

          // Save Inventory Entry
          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              itemId: parseInt(item.itemId),
              quantity: type === "SALES" ? -qty : qty,
              rate: rate,
              amount: lineAmount, // Store base amount in inventory
            },
          });
        }

        // --- ACCOUNTING POSTING LOGIC ---
        if (!partyLedgerId || !salesPurchaseLedgerId)
          throw new Error("Missing Ledgers");

        const partyId = parseInt(partyLedgerId);
        const accountId = parseInt(salesPurchaseLedgerId);

        // Grand Total = Item Total + Tax Total (only if tax ledger is selected)
        const finalTax = taxLedgerId ? taxTotal : 0;
        const grandTotal = itemTotal + finalTax;

        if (type === "SALES") {
          // 1. Debit Party (Grand Total: Goods + Tax)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: grandTotal,
            },
          });

          // 2. Credit Sales Account (Pure Goods Value)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: -itemTotal,
            },
          });

          // 3. Credit Tax Account (Tax Value) - Only if enabled
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
          // PURCHASE LOGIC

          // 1. Credit Party (Grand Total)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: -grandTotal,
            },
          });

          // 2. Debit Purchase Account (Pure Goods Value)
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: itemTotal,
            },
          });

          // 3. Debit Tax Account (Tax Value) - Only if enabled
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
      } else if (rows) {
        // D. Standard Accounting Logic (No Inventory)
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

      return voucher;
    });

    return { success: true, code: transactionCode, id: newVoucher.id };
  } catch (e) {
    console.error(e);
    return { error: "Failed to save voucher. Database error." };
  }
}

// ==========================================
// 2. FETCH VOUCHER BY CODE
// ==========================================
export async function getVoucherByCode(code: string, companyId: number) {
  const voucher = await prisma.voucher.findFirst({
    where: {
      transactionCode: code,
      companyId: companyId,
    },
    include: {
      entries: { include: { ledger: true } },
      inventory: { include: { item: true } },
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
// 4. ALIAS EXPORT
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

    await prisma.inventoryEntry.deleteMany({ where: { voucherId } });
    await prisma.voucherEntry.deleteMany({ where: { voucherId } });
    await prisma.voucher.delete({ where: { id: voucherId } });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete voucher" };
  }
}
