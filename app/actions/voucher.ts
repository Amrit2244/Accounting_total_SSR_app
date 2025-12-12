"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { validateVoucherRules } from "@/lib/voucher-rules";

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
// 1. CREATE VOUCHER (Handles Accounting & Inventory)
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

  // Validate Rules (Only for standard accounting vouchers)
  if (rows && !isInventoryVoucher) {
    const entries = JSON.parse(rows);
    const ruleError = await validateVoucherRules(type, entries);
    if (ruleError) return { error: ruleError };

    // Math Check
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

      // B. Maker-Checker Status
      // Default: PENDING. Only ADMIN/CHECKER can auto-approve.
      const user = await tx.user.findUnique({ where: { id: userId } });
      const status =
        user?.role === "CHECKER" || user?.role === "ADMIN"
          ? "APPROVED"
          : "PENDING";
      const verifierId = status === "APPROVED" ? userId : null;

      // C. Create Header
      const voucher = await tx.voucher.create({
        data: {
          date: new Date(date),
          voucherNo: nextNo,
          type: type,
          narration,
          companyId: cid,
          status: status,
          createdById: userId,
          verifiedById: verifierId,
        },
      });

      // D. Logic Branch: Inventory vs Accounting
      if (isInventoryVoucher && inventoryRows) {
        // --- INVENTORY LOGIC ---
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
          }); // Party Dr
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: -totalAmount,
            },
          }); // Sales Cr
        } else {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: partyId,
              amount: -totalAmount,
            },
          }); // Party Cr
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: accountId,
              amount: totalAmount,
            },
          }); // Purchase Dr
        }
      } else if (rows) {
        // --- STANDARD ACCOUNTING LOGIC ---
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
    return { error: "Failed to save voucher. Database error." };
  }

  revalidatePath(`/companies/${cid}/vouchers`);
  redirect(`/companies/${cid}/vouchers`);
}

// ==========================================
// 2. VERIFY VOUCHER (Called by VerifyBtn)
// ==========================================
export async function verifyVoucher(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) return { error: "Voucher not found" };

    // Maker-Checker Security Rule:
    if (voucher.createdById === userId) {
      // In strict banking, you cannot verify your own entry.
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
// 3. DELETE VOUCHER
// ==========================================
export async function deleteVoucher(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) return { error: "Voucher not found" };

    // Deletion Rules
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (voucher.status === "APPROVED") {
      if (user?.role !== "ADMIN") {
        return { error: "Approved vouchers can only be deleted by Admin." };
      }
    } else {
      if (voucher.createdById !== userId && user?.role !== "ADMIN") {
        return { error: "You can only delete your own pending vouchers." };
      }
    }

    await prisma.inventoryEntry.deleteMany({ where: { voucherId } });
    await prisma.voucherEntry.deleteMany({ where: { voucherId } });
    await prisma.voucher.delete({ where: { id: voucherId } });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete voucher" };
  }
}
