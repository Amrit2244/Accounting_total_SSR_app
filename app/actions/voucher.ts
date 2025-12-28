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
  success?: boolean;
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
// 1. GET VOUCHERS (With Dr/Cr Fix)
// ==========================================
export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date
) {
  const baseWhere: any = { companyId };
  if (startDate && endDate) baseWhere.date = { gte: startDate, lte: endDate };

  try {
    // We include ledgerEntries and the ledger name for every single type
    const [sales, purchase, payment, receipt, contra, journal, stockJournal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.purchaseVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.paymentVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.receiptVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.contraVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.journalVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ledgerEntries: { include: { ledger: true } } },
        }),
        prisma.stockJournal.findMany({
          where: baseWhere,
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
        // Tally: Dr is negative amount, Cr is positive
        const drEntry = entries.find((e: any) => e.amount < 0);
        const crEntry = entries.find((e: any) => e.amount > 0);
        drLabel = drEntry?.ledger?.name || "Receiver Not Found";
        crLabel = crEntry?.ledger?.name || "Bank/Cash Not Found";
      } else if (type === "RECEIPT") {
        const drEntry = entries.find((e: any) => e.amount < 0);
        const crEntry = entries.find((e: any) => e.amount > 0);
        drLabel = drEntry?.ledger?.name || "Bank/Cash Not Found";
        crLabel = crEntry?.ledger?.name || "Giver Not Found";
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

    return all.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

// ==========================================
// 2. SEARCH VOUCHER (Required by QuickVerify.tsx)
// ==========================================
export async function findVoucherByCode(txCode: string, companyId: number) {
  const where = { transactionCode: txCode, companyId };

  const tables = [
    { model: prisma.salesVoucher, type: "SALES" },
    { model: prisma.purchaseVoucher, type: "PURCHASE" },
    { model: prisma.paymentVoucher, type: "PAYMENT" },
    { model: prisma.receiptVoucher, type: "RECEIPT" },
    { model: prisma.contraVoucher, type: "CONTRA" },
    { model: prisma.journalVoucher, type: "JOURNAL" },
  ];

  for (const table of tables) {
    const v = await (table.model as any).findFirst({
      where,
      select: { id: true },
    });
    if (v) return { success: true, id: v.id, type: table.type };
  }

  return { error: "Voucher not found" };
}

// ==========================================
// 3. DELETE & VERIFY
// ==========================================
export async function deleteVoucher(voucherId: number, type: string) {
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
  return { success: true };
}

export async function verifyVoucher(voucherId: number, type: string) {
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
  return { success: true };
}
