"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export type State = {
  success: boolean;
  error?: string;
  message?: string;
  txid?: string;
  id?: number;
};

// --- SAFE HELPER: PREVENT DUPLICATE TXID ---
async function generateUniqueTXID(): Promise<string> {
  let uniqueId = "";
  let exists = true;

  while (exists) {
    const candidate = Math.floor(10000 + Math.random() * 90000).toString();

    const checks = await Promise.all([
      prisma.salesVoucher.findUnique({ where: { transactionCode: candidate } }),
      prisma.purchaseVoucher.findUnique({
        where: { transactionCode: candidate },
      }),
      prisma.paymentVoucher.findUnique({
        where: { transactionCode: candidate },
      }),
      prisma.receiptVoucher.findUnique({
        where: { transactionCode: candidate },
      }),
      prisma.contraVoucher.findUnique({
        where: { transactionCode: candidate },
      }),
      prisma.journalVoucher.findUnique({
        where: { transactionCode: candidate },
      }),
    ]);

    if (checks.every((v) => v === null)) {
      uniqueId = candidate;
      exists = false;
    }
  }
  return uniqueId;
}

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

// ==========================================
// 1. GET VOUCHERS LIST (Daybook Logic)
// ==========================================
export async function getApprovedEntries(ledgerId: number) {
  return await prisma.receiptLedgerEntry.findMany({
    where: {
      ledgerId,
      receiptVoucher: { status: "APPROVED" },
    },
  });
}

export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
) {
  const baseWhere: any = { companyId };
  if (startDate && endDate) baseWhere.date = { gte: startDate, lte: endDate };

  try {
    const commonInclude = { ledgerEntries: { include: { ledger: true } } };
    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: {
            ...commonInclude,
            inventoryEntries: { include: { stockItem: true } },
          },
        }),
        prisma.purchaseVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: {
            ...commonInclude,
            inventoryEntries: { include: { stockItem: true } },
          },
        }),
        prisma.paymentVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: commonInclude,
        }),
        prisma.receiptVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: commonInclude,
        }),
        prisma.contraVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: commonInclude,
        }),
        prisma.journalVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: commonInclude,
        }),
      ]);

    const formatVoucher = (v: any, type: string) => {
      let drLabel = "—",
        crLabel = "—";
      const entries = v.ledgerEntries || [];

      /**
       * TALLY CONVENTION LOGIC:
       * In Tally-imported data:
       * Negative Amount = Debit (Dr)
       * Positive Amount = Credit (Cr)
       */

      if (type === "SALES") {
        drLabel = v.partyName || "Sales Party";
        // Cr side is usually the positive sales ledger
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Sales A/c";
      } else if (type === "PURCHASE") {
        crLabel = v.partyName || "Purchase Party";
        // Dr side is usually the negative purchase ledger
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name ||
          "Purchase A/c";
      } else if (type === "PAYMENT") {
        // Receiver is Dr (Negative), Bank/Cash is Cr (Positive)
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name || "Receiver";
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Bank/Cash";
      } else if (type === "RECEIPT") {
        // Bank/Cash is Dr (Negative), Giver is Cr (Positive)
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name || "Bank/Cash";
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Giver";
      } else {
        // For CONTRA and JOURNAL
        drLabel = entries.find((e: any) => e.amount < 0)?.ledger?.name || "—";
        crLabel = entries.find((e: any) => e.amount > 0)?.ledger?.name || "—";
      }

      return {
        ...v,
        type,
        drLabel,
        crLabel,
        displayParticulars: `${drLabel} / ${crLabel}`,
        entries: entries.map((e: any) => ({
          ...e,
          displayAmount: Math.abs(e.amount),
          side: e.amount < 0 ? "Dr" : "Cr", // Negative as Dr, Positive as Cr
        })),
      };
    };

    const all = [
      ...sales.map((v) => formatVoucher(v, "SALES")),
      ...purchase.map((v) => formatVoucher(v, "PURCHASE")),
      ...payment.map((v) => formatVoucher(v, "PAYMENT")),
      ...receipt.map((v) => formatVoucher(v, "RECEIPT")),
      ...contra.map((v) => formatVoucher(v, "CONTRA")),
      ...journal.map((v) => formatVoucher(v, "JOURNAL")),
    ];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return all
        .filter(
          (v) =>
            v.voucherNo.toString().includes(q) ||
            v.displayParticulars.toLowerCase().includes(q) ||
            v.narration?.toLowerCase().includes(q)
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
    return all.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (e) {
    return [];
  }
}

// ==========================================
// 2. FETCH FULL VOUCHER BY CODE
// ==========================================
export async function getVoucherByCode(txCode: string, companyId: number) {
  const where = { transactionCode: txCode, companyId };
  const tables = [
    { model: prisma.salesVoucher, type: "SALES", hasInv: true },
    { model: prisma.purchaseVoucher, type: "PURCHASE", hasInv: true },
    { model: prisma.paymentVoucher, type: "PAYMENT", hasInv: false },
    { model: prisma.receiptVoucher, type: "RECEIPT", hasInv: false },
    { model: prisma.contraVoucher, type: "CONTRA", hasInv: false },
    { model: prisma.journalVoucher, type: "JOURNAL", hasInv: false },
  ];

  for (const t of tables) {
    const include: any = {
      createdBy: { select: { id: true, name: true } },
      ledgerEntries: { include: { ledger: { include: { group: true } } } },
    };
    if (t.hasInv) include.inventoryEntries = { include: { stockItem: true } };
    const v = await (t.model as any).findFirst({ where, include });
    if (v)
      return {
        ...v,
        type: t.type,
        entries: v.ledgerEntries || [],
        inventory: v.inventoryEntries || [],
      };
  }
  return null;
}

// ==========================================
// 3. QUICK FIND FOR VERIFICATION
// ==========================================
export async function findVoucherByCode(txCode: string, companyId: number) {
  try {
    const v = await getVoucherByCode(txCode, companyId);
    return v
      ? { success: true, id: v.id, type: v.type }
      : { success: false, error: "Voucher not found" };
  } catch (e) {
    return { success: false, error: "Database error" };
  }
}

// ==========================================
// 4. ACTION: CREATE VOUCHER (Collision Resistant)
// ==========================================
export async function createVoucher(
  prevState: any,
  formData: FormData
): Promise<State> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const companyId = parseInt(formData.get("companyId") as string);
    const type = ((formData.get("type") as string) || "").toUpperCase();
    const date = new Date(formData.get("date") as string);
    const narration = (formData.get("narration") as string) || "";
    const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0;
    const ledgerData = JSON.parse(
      (formData.get("ledgerEntries") as string) || "[]"
    );

    if (totalAmount === 0 || ledgerData.length === 0) {
      return { success: false, error: "Amount or Ledger Entries missing." };
    }

    const txid = await generateUniqueTXID();

    const result = await prisma.$transaction(async (tx) => {
      const seq = await tx.voucherSequence.upsert({
        where: { companyId_voucherType: { companyId, voucherType: type } },
        update: { lastNo: { increment: 1 } },
        create: { companyId, voucherType: type, lastNo: 1 },
      });

      const base = {
        companyId,
        voucherNo: seq.lastNo,
        transactionCode: txid,
        date,
        narration,
        totalAmount,
        createdById: userId,
        status: "PENDING",
      };

      const ledgerOps = {
        create: ledgerData.map((e: any) => ({
          ledgerId: parseInt(e.ledgerId),
          amount: parseFloat(e.amount),
        })),
      };

      if (type === "RECEIPT")
        return tx.receiptVoucher.create({
          data: { ...base, ledgerEntries: ledgerOps },
        });
      if (type === "PAYMENT")
        return tx.paymentVoucher.create({
          data: { ...base, ledgerEntries: ledgerOps },
        });
      if (type === "CONTRA")
        return tx.contraVoucher.create({
          data: { ...base, ledgerEntries: ledgerOps },
        });
      if (type === "JOURNAL")
        return tx.journalVoucher.create({
          data: { ...base, ledgerEntries: ledgerOps },
        });

      throw new Error("Invalid Voucher Type");
    });

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      message: "Voucher Created (Awaiting Approval)",
      txid,
      id: result.id,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// 5. BULK DELETE
// ==========================================
export async function deleteBulkVouchers(
  items: { id: number; type: string }[],
  companyId?: number
): Promise<State> {
  try {
    for (const item of items) {
      const tableMap: any = {
        SALES: prisma.salesVoucher,
        PURCHASE: prisma.purchaseVoucher,
        PAYMENT: prisma.paymentVoucher,
        RECEIPT: prisma.receiptVoucher,
        CONTRA: prisma.contraVoucher,
        JOURNAL: prisma.journalVoucher,
      };
      await tableMap[item.type.toUpperCase()].delete({
        where: { id: item.id },
      });
    }
    revalidatePath("/");
    return { success: true, message: "Vouchers deleted" };
  } catch (e) {
    return { success: false, error: "Failed to delete" };
  }
}

// ==========================================
// 6. VERIFY ACTION (APPROVAL)
// ==========================================
export async function verifyVoucher(
  voucherId: number,
  type: string
): Promise<State> {
  try {
    const userId = await getCurrentUserId();
    const t = type.toUpperCase();

    const tableMap: any = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
    };

    await tableMap[t].update({
      where: { id: voucherId },
      data: {
        status: "APPROVED",
        verifiedById: userId,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Voucher Approved and Posted to accounts.",
    };
  } catch (e) {
    return { success: false, error: "Approval failed" };
  }
}
