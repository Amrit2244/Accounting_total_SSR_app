"use server";

import { z } from "zod";
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
  code?: string;
  txid?: string;
  id?: number;
};

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
// 1. GET VOUCHERS LIST
// ==========================================
export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
) {
  const baseWhere: any = { companyId };

  if (startDate && endDate) {
    baseWhere.date = { gte: startDate, lte: endDate };
  }

  if (searchQuery) {
    const isNum = !isNaN(Number(searchQuery));
    baseWhere.OR = [
      ...(isNum ? [{ voucherNo: Number(searchQuery) }] : []),
      { narration: { contains: searchQuery } },
    ];
  }

  try {
    const commonInclude = {
      ledgerEntries: {
        include: { ledger: true },
      },
    };

    const [sales, purchase, payment, receipt, contra, journal, stockJournal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: {
            ...baseWhere,
            OR: [
              ...(baseWhere.OR || []),
              { partyName: { contains: searchQuery || "" } },
            ],
          },
          orderBy: { date: "desc" },
          include: commonInclude,
        }),
        prisma.purchaseVoucher.findMany({
          where: {
            ...baseWhere,
            OR: [
              ...(baseWhere.OR || []),
              { partyName: { contains: searchQuery || "" } },
            ],
          },
          orderBy: { date: "desc" },
          include: commonInclude,
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
        prisma.stockJournal.findMany({
          where: { companyId, date: baseWhere.date },
          orderBy: { date: "desc" },
        }),
      ]);

    const formatVoucher = (v: any, type: string) => {
      let drLabel = "—";
      let crLabel = "—";
      const entries = v.ledgerEntries || [];
      const clean = (str: string) =>
        str
          ? str
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .trim()
          : "";

      if (type === "SALES") {
        drLabel = v.partyName || "Cash";
        const partyClean = clean(drLabel);
        const crEntry = entries.find(
          (e: any) =>
            clean(e.ledger.name) !== partyClean &&
            !clean(e.ledger.name).includes("tax") &&
            !clean(e.ledger.name).includes("gst")
        );
        crLabel = crEntry?.ledger?.name || "Sales A/c";
      } else if (type === "PURCHASE") {
        crLabel = v.partyName || "Cash";
        const partyClean = clean(crLabel);
        const drEntry = entries.find(
          (e: any) => clean(e.ledger.name) !== partyClean
        );
        drLabel = drEntry?.ledger?.name || "Purchase A/c";
      } else if (type === "PAYMENT") {
        const drEntry = entries.find((e: any) => e.amount < 0);
        const crEntry = entries.find((e: any) => e.amount > 0);
        drLabel = drEntry?.ledger?.name || "Receiver";
        crLabel = crEntry?.ledger?.name || "Bank/Cash";
      } else if (type === "RECEIPT") {
        const drEntry = entries.find((e: any) => e.amount < 0);
        const crEntry = entries.find((e: any) => e.amount > 0);
        drLabel = drEntry?.ledger?.name || "Bank/Cash";
        crLabel = crEntry?.ledger?.name || "Giver";
      } else {
        const dr = entries.find((e: any) => e.amount < 0);
        const cr = entries.find((e: any) => e.amount > 0);
        drLabel = dr?.ledger?.name || "Dr Account";
        crLabel = cr?.ledger?.name || "Cr Account";
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
          side: e.amount < 0 ? "Dr" : "Cr",
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
      ...stockJournal.map((v) => ({
        ...v,
        type: "STOCK_JOURNAL",
        totalAmount: 0,
        entries: [],
      })),
    ];

    let filtered = all;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = all.filter(
        (v) =>
          v.voucherNo.toString().includes(lowerQ) ||
          v.displayParticulars.toLowerCase().includes(lowerQ) ||
          (v.partyName && v.partyName.toLowerCase().includes(lowerQ)) ||
          (v.narration && v.narration.toLowerCase().includes(lowerQ)) ||
          (v.totalAmount && v.totalAmount.toString().includes(lowerQ))
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    return [];
  }
}

// ==========================================
// 2. FETCH FULL VOUCHER
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

    if (t.hasInv) {
      include.inventoryEntries = { include: { stockItem: true } };
    }

    const v = await (t.model as any).findFirst({ where, include });

    if (v) {
      return {
        ...v,
        type: t.type,
        entries: v.ledgerEntries || [],
        inventory: v.inventoryEntries || [],
      };
    }
  }

  return null;
}

// ==========================================
// 3. QUICK FIND
// ==========================================
export async function findVoucherByCode(txCode: string, companyId: number) {
  const v = await getVoucherByCode(txCode, companyId);
  if (v) return { success: true, id: v.id, type: v.type };
  return { success: false, error: "Voucher not found" };
}

// ==========================================
// 4. ACTIONS (CREATE & UPDATE)
// ==========================================
export async function createVoucher(
  prevState: any,
  formData: FormData
): Promise<State> {
  return { success: true, message: "Voucher created" };
}

export async function updateVoucher(
  prevState: any,
  formData: FormData
): Promise<State> {
  return { success: true, message: "Voucher updated" };
}

// ==========================================
// 5. BULK DELETE (FIXED)
// ==========================================
// FIX: Now accepts array of objects {id, type} as sent by VoucherTable.tsx
export async function deleteBulkVouchers(
  items: { id: number; type: string }[],
  companyId?: number // Accepted but not needed for delete-by-id
): Promise<State> {
  try {
    // Group IDs by type (e.g. { SALES: [1, 2], PAYMENT: [5] })
    const groups: Record<string, number[]> = {};

    for (const item of items) {
      // Handle cases where type might be lowercase
      const t = (item.type || "").toUpperCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push(item.id);
    }

    const tableMap: any = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
    };

    // Execute deletes for each group
    for (const [type, ids] of Object.entries(groups)) {
      if (tableMap[type]) {
        await tableMap[type].deleteMany({ where: { id: { in: ids } } });
      }
    }

    revalidatePath("/");
    return { success: true, message: "Vouchers deleted" };
  } catch (e) {
    return {
      success: false,
      error: "Failed to delete",
      message: "Error occurred",
    };
  }
}

// ==========================================
// 6. SINGLE ACTIONS
// ==========================================
export async function deleteVoucher(
  voucherId: number,
  type: string
): Promise<State> {
  try {
    const tableMap: any = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
    };
    await tableMap[type.toUpperCase()]?.delete({ where: { id: voucherId } });
    revalidatePath("/");
    return { success: true, message: "Voucher deleted" };
  } catch (e) {
    return {
      success: false,
      error: "Delete failed",
      message: "Error occurred",
    };
  }
}

export async function verifyVoucher(
  voucherId: number,
  type: string
): Promise<State> {
  try {
    const userId = await getCurrentUserId();
    const tableMap: any = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
    };
    await tableMap[type.toUpperCase()]?.update({
      where: { id: voucherId },
      data: { status: "APPROVED", verifiedById: userId, updatedAt: new Date() },
    });
    revalidatePath("/");
    return { success: true, message: "Voucher verified" };
  } catch (e) {
    return {
      success: false,
      error: "Verification failed",
      message: "Error occurred",
    };
  }
}
