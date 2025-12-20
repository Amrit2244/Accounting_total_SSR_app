"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { uploadFile } from "@/app/actions/upload";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- Validation Schemas ---
const VoucherSchema = z.object({
  date: z.string().min(1),
  type: z.enum([
    "CONTRA",
    "PAYMENT",
    "RECEIPT",
    "JOURNAL",
    "SALES",
    "PURCHASE",
    "STOCK_JOURNAL",
  ]),
  narration: z.string().optional(),
  reference: z.string().optional(),
  voucherNo: z.string().optional(), // ✅ Added for manual numbering
  companyId: z.string(),
  rows: z.string().optional(),
  inventoryRows: z.string().optional(),
  partyLedgerId: z.string().optional(),
  salesPurchaseLedgerId: z.string().optional(),
  taxLedgerId: z.string().optional(),
});

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch {
    return null;
  }
}

export async function getVoucherByCode(code: string, companyId: number) {
  return await prisma.voucher.findFirst({
    where: {
      OR: [{ transactionCode: code }, { voucherNo: code }],
      companyId,
    },
    include: {
      entries: {
        include: {
          ledger: {
            include: { group: true },
          },
        },
      },
      inventory: { include: { stockItem: true } },
      createdBy: true,
      verifiedBy: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createVoucher(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = VoucherSchema.safeParse(data);
  if (!result.success) return { error: result.error.issues[0].message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const {
    date,
    type,
    narration,
    reference,
    voucherNo, // ✅ Manual voucher number from form
    companyId,
    rows,
    inventoryRows,
    partyLedgerId,
    salesPurchaseLedgerId,
    taxLedgerId,
  } = result.data;

  const cid = parseInt(companyId);
  const transactionCode = Math.floor(10000 + Math.random() * 90000).toString();

  const file = formData.get("attachment") as File;
  let attachmentUrl = null;
  if (file && file.size > 0) attachmentUrl = await uploadFile(file);

  try {
    const newVoucher = await prisma.$transaction(async (tx) => {
      let finalVoucherNo = voucherNo?.trim();

      // ✅ Only generate sequence if voucherNo wasn't provided manually
      if (!finalVoucherNo) {
        const lastV = await tx.voucher.findFirst({
          where: { companyId: cid, type: type },
          orderBy: { id: "desc" },
          select: { voucherNo: true },
        });

        let seq = await tx.voucherSequence.findUnique({
          where: {
            companyId_voucherType: { companyId: cid, voucherType: type },
          },
        });

        if (!seq) {
          seq = await tx.voucherSequence.create({
            data: { companyId: cid, voucherType: type, lastNo: 0 },
          });
        }

        const dbLastNo = lastV ? parseInt(lastV.voucherNo) : 0;
        const nextNoInt = Math.max(seq.lastNo, dbLastNo) + 1;

        await tx.voucherSequence.update({
          where: { id: seq.id },
          data: { lastNo: nextNoInt },
        });

        finalVoucherNo = nextNoInt.toString();
      }

      const voucher = await tx.voucher.create({
        data: {
          date: new Date(date),
          voucherNo: finalVoucherNo,
          transactionCode,
          type,
          narration,
          reference,
          companyId: cid,
          status: "PENDING",
          createdById: userId,
          attachmentUrl,
        },
      });

      // ✅ Fixed Inventory Parsing logic to prevent String vs Float error
      if (type === "SALES" || type === "PURCHASE") {
        const items = JSON.parse(inventoryRows || "[]");
        let totalVal = 0;
        let totalTax = 0;

        for (const item of items) {
          // Force conversion to numbers to satisfy Prisma Float requirements
          const qty = parseFloat(item.qty) || 0;
          const rate = parseFloat(item.rate) || 0;
          const gst = parseFloat(item.gst) || 0;

          const lineVal = qty * rate;
          totalVal += lineVal;
          totalTax += lineVal * (gst / 100);

          await tx.inventoryEntry.create({
            data: {
              voucherId: voucher.id,
              stockItemId: parseInt(item.itemId),
              itemName: "Item",
              quantity: type === "SALES" ? -Math.abs(qty) : Math.abs(qty),
              rate: rate, // Now explicitly a number
              amount: lineVal,
            },
          });
        }

        const taxVal = taxLedgerId ? totalTax : 0;

        // Party Ledger Entry
        await tx.voucherEntry.create({
          data: {
            voucherId: voucher.id,
            ledgerId: parseInt(partyLedgerId!),
            amount: type === "SALES" ? totalVal + taxVal : -(totalVal + taxVal),
          },
        });

        // Sales/Purchase Ledger Entry
        await tx.voucherEntry.create({
          data: {
            voucherId: voucher.id,
            ledgerId: parseInt(salesPurchaseLedgerId!),
            amount: type === "SALES" ? -totalVal : totalVal,
          },
        });

        // Tax Ledger Entry
        if (taxLedgerId) {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: parseInt(taxLedgerId),
              amount: type === "SALES" ? -taxVal : taxVal,
            },
          });
        }
      } else if (rows) {
        const entries = JSON.parse(rows);
        for (const e of entries) {
          await tx.voucherEntry.create({
            data: {
              voucherId: voucher.id,
              ledgerId: parseInt(e.ledgerId),
              amount:
                e.type === "Dr"
                  ? Math.abs(parseFloat(e.amount))
                  : -Math.abs(parseFloat(e.amount)),
            },
          });
        }
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          voucherId: voucher.id,
          userId,
          userName: user?.name || "User",
          action: "CREATED",
        },
      });

      return voucher;
    });

    revalidatePath(`/companies/${cid}/vouchers`);
    return { success: true, code: transactionCode, id: newVoucher.id };
  } catch (err) {
    console.error("Voucher creation error:", err);
    return { error: "Voucher Sync Error. Please check data and try again." };
  }
}

export async function verifyVoucher(voucherId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { inventory: true },
    });

    if (!voucher) return { error: "Voucher not found" };
    if (voucher.createdById === userId)
      return { error: "Maker-Checker Conflict." };

    await prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          status: "APPROVED",
          verifiedById: userId,
          updatedAt: new Date(),
        },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          voucherId: voucher.id,
          userId,
          userName: user?.name || "Checker",
          action: "VERIFIED",
        },
      });
    });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Verification Failed" };
  }
}

export async function deleteVoucher(voucherId: number) {
  try {
    const v = await prisma.voucher.findUnique({ where: { id: voucherId } });
    await prisma.voucher.delete({ where: { id: voucherId } });
    revalidatePath(`/companies/${v?.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Delete Failed." };
  }
}

export async function rejectVoucher(voucherId: number, reason: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };
  if (!reason.trim()) return { error: "Rejection reason is required." };

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) return { error: "Voucher not found" };
    if (voucher.createdById === userId)
      return { error: "You cannot reject your own entry." };

    await prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          voucherId: voucher.id,
          userId,
          userName: user?.name || "Checker",
          action: "REJECTED",
          details: `Reason: ${reason}`,
        },
      });
    });

    revalidatePath(`/companies/${voucher.companyId}/vouchers`);
    return { success: true };
  } catch (e) {
    return { error: "Rejection Failed" };
  }
}
