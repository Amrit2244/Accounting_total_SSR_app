"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- Validation Schemas ---
const AccountRowSchema = z.object({
  ledgerId: z.string(),
  amount: z.coerce.number(),
  type: z.enum(["Dr", "Cr"]),
});

const InventoryRowSchema = z.object({
  itemId: z.string(),
  qty: z.coerce.number(),
  rate: z.coerce.number(),
  gst: z.coerce.number().optional().default(0),
});

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
  taxLedgerId: z.string().optional(),
});

// --- Helper: Get User ---
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
// 1. CREATE VOUCHER (FIXED: REMOVED STOCK UPDATE)
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
    taxLedgerId,
  } = result.data;

  const cid = parseInt(companyId);
  const userId = await getCurrentUserId();
  if (!userId) return { error: "User not authenticated" };

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

      // ====================================================
      // C. SALES & PURCHASE LOGIC
      // ====================================================
      if (type === "SALES" || type === "PURCHASE") {
        if (!inventoryRows || !partyLedgerId || !salesPurchaseLedgerId) {
          throw new Error(
            "Validation Error: Missing Items or Ledgers for Sales/Purchase"
          );
        }

        const items = z
          .array(InventoryRowSchema)
          .parse(JSON.parse(inventoryRows));

        let totalGoodsValue = 0;
        let totalTaxValue = 0;

        // 2. Process Inventory Items
        for (const item of items) {
          const itemIdInt = parseInt(item.itemId);

          // Get Item Name
          const stockItem = await tx.stockItem.findUnique({
            where: { id: itemIdInt },
          });

          if (!stockItem) throw new Error(`Item ID ${itemIdInt} not found`);

          const lineAmount = item.qty * item.rate;
          const lineTax = lineAmount * (item.gst / 100);

          totalGoodsValue += lineAmount;
          totalTaxValue += lineTax;

          // Save Inventory Row
          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              stockItemId: itemIdInt, // ✅ Correct Field Name
              itemName: stockItem.name,
              quantity:
                type === "SALES" ? -Math.abs(item.qty) : Math.abs(item.qty),
              rate: item.rate,
              amount: lineAmount,
            },
          });

          // ⚠️ NOTE: I removed the `tx.stockItem.update` code because your DB schema
          // does not have a `currentStock` column. Stock will be calculated dynamically.
        }

        // 3. Accounting Entries
        const partyId = parseInt(partyLedgerId);
        const accountId = parseInt(salesPurchaseLedgerId);

        const finalTax = taxLedgerId ? totalTaxValue : 0;
        const grandTotal = totalGoodsValue + finalTax;

        if (type === "SALES") {
          // Debit Party
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: grandTotal,
            },
          });
          // Credit Sales
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: -totalGoodsValue,
            },
          });
          // Credit Tax
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
          // PURCHASE
          // Credit Party
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: -grandTotal,
            },
          });
          // Debit Purchase
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: totalGoodsValue,
            },
          });
          // Debit Tax
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
      // ====================================================
      // D. STANDARD VOUCHER LOGIC
      // ====================================================
      else if (rows) {
        const entries = z.array(AccountRowSchema).parse(JSON.parse(rows));
        for (const entry of entries) {
          const val = entry.amount;
          const dbAmount = entry.type === "Dr" ? Math.abs(val) : -Math.abs(val);

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
  } catch (e: any) {
    console.error("Create Voucher Error:", e);
    return { error: e.message || "Failed to save voucher. Database error." };
  }
}

// ==========================================
// 2. FETCH VOUCHER
// ==========================================
export async function getVoucherByCode(code: string, companyId: number) {
  const standardInclude = {
    entries: { include: { ledger: true } },
    inventory: { include: { stockItem: true } },
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
    });
    if (!voucher) return { error: "Not Found" };
    if (voucher.createdById === userId)
      return { error: "Maker cannot verify own voucher" };

    await prisma.voucher.update({
      where: { id: voucherId },
      data: { status: "APPROVED", verifiedById: userId },
    });
    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Verification Failed" };
  }
}
export const verifyVoucher = verifyVoucherAction;

// ==========================================
// 4. DELETE VOUCHER (REMOVED STOCK LOGIC)
// ==========================================
export async function deleteVoucher(voucherId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      // Simply delete entries. No stock reversal needed as stock is dynamic.
      await tx.inventoryEntry.deleteMany({ where: { voucherId } });
      await tx.voucherEntry.deleteMany({ where: { voucherId } });
      await tx.voucher.delete({ where: { id: voucherId } });
    });
    return { success: true };
  } catch (e) {
    return { error: "Delete Failed" };
  }
}
