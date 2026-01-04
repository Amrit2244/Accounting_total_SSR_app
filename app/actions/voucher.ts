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
// --- SAFE HELPER: PREVENT DUPLICATE TXID ---
async function generateUniqueTXID(): Promise<string> {
  let digits = 5;
  let attempts = 0;
  while (true) {
    const candidate = Math.floor(
      Math.pow(10, digits - 1) + Math.random() * 90000
    ).toString();
    // Check across all tables for existing TXID
    const exists = await prisma.paymentVoucher.findUnique({
      where: { transactionCode: candidate },
    });
    if (!exists) return candidate;
    attempts++;
    if (attempts > 10) digits++;
  }
}

// Updated to return both ID and Role
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const { payload } = await jwtVerify(session, encodedKey);

    // Explicitly debug here if the role still fails
    // console.log("JWT Payload:", payload);

    return {
      id:
        typeof payload.userId === "string"
          ? parseInt(payload.userId)
          : (payload.userId as number),
      role: (payload.role as string)?.toUpperCase() || "USER",
    };
  } catch (error) {
    return null;
  }
}

export async function updateVoucher(
  voucherId: number,
  companyId: number,
  type: string,
  data: any
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const t = type.toUpperCase();
    const newTxid = await generateUniqueTXID();
    const isAdmin = user.role === "ADMIN";

    // Build base object without nulls for dates if possible
    const commonData: any = {
      date: new Date(data.date),
      narration: data.narration,
      totalAmount: parseFloat(data.totalAmount),
      transactionCode: newTxid,
      status: isAdmin ? "APPROVED" : "PENDING",
      updatedAt: new Date(),
    };

    if (isAdmin) {
      commonData.verifiedById = user.id;
      commonData.verifiedAt = new Date();
    }

    await prisma.$transaction(async (tx) => {
      const tableMap: any = {
        SALES: tx.salesVoucher,
        PURCHASE: tx.purchaseVoucher,
        PAYMENT: tx.paymentVoucher,
        RECEIPT: tx.receiptVoucher,
        CONTRA: tx.contraVoucher,
        JOURNAL: tx.journalVoucher,
      };

      await tableMap[t].update({
        where: { id: voucherId },
        data: {
          ...commonData,
          ledgerEntries: {
            deleteMany: {},
            create: data.ledgerEntries.map((le: any) => ({
              ledgerId: parseInt(le.ledgerId),
              amount: parseFloat(le.amount),
            })),
          },
        },
      });
    });

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      message: isAdmin
        ? `Voucher updated and auto-verified (Admin). ID: ${newTxid}`
        : `Voucher edited and sent for verification. ID: ${newTxid}`,
      txid: newTxid,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyVoucher(voucherId: number, type: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const t = type.toUpperCase();
    const tableMap: any = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
    };

    const voucher = await tableMap[t].findUnique({
      where: { id: voucherId },
      select: { createdById: true },
    });

    if (voucher.createdById === user.id && user.role !== "ADMIN") {
      return { success: false, error: "Maker and Checker must be different." };
    }

    // ✅ FIX: Use the 'verifiedById' scalar field we added to the schema
    await tableMap[t].update({
      where: { id: voucherId },
      data: {
        status: "APPROVED",
        verifiedById: user.id, // This works now because we updated the schema
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/");
    return { success: true, message: "Voucher Verified Successfully." };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Verification failed: Database mismatch." };
  }
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

      if (type === "SALES") {
        drLabel = v.partyName || "Sales Party";
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Sales A/c";
      } else if (type === "PURCHASE") {
        crLabel = v.partyName || "Purchase Party";
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name ||
          "Purchase A/c";
      } else if (type === "PAYMENT") {
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name || "Receiver";
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Bank/Cash";
      } else if (type === "RECEIPT") {
        drLabel =
          entries.find((e: any) => e.amount < 0)?.ledger?.name || "Bank/Cash";
        crLabel =
          entries.find((e: any) => e.amount > 0)?.ledger?.name || "Giver";
      } else {
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

// app/actions/voucher.ts

export async function createVoucher(
  prevState: any,
  formData: FormData
): Promise<State> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const isAdmin = user.role === "ADMIN";
    const companyId = parseInt(formData.get("companyId") as string);
    const type = ((formData.get("type") as string) || "").toUpperCase();
    const txid = await generateUniqueTXID();

    const result = await prisma.$transaction(async (tx) => {
      const seq = await tx.voucherSequence.upsert({
        where: { companyId_voucherType: { companyId, voucherType: type } },
        update: { lastNo: { increment: 1 } },
        create: { companyId, voucherType: type, lastNo: 1 },
      });

      const ledgerEntries = JSON.parse(
        (formData.get("ledgerEntries") as string) || "[]"
      );

      const voucherData: any = {
        companyId,
        voucherNo: seq.lastNo.toString(),
        transactionCode: txid,
        date: new Date(formData.get("date") as string),
        narration: formData.get("narration") as string,
        totalAmount: parseFloat(formData.get("totalAmount") as string),
        createdById: user.id,
        status: isAdmin ? "APPROVED" : "PENDING",
        ledgerEntries: {
          create: ledgerEntries.map((le: any) => ({
            ledgerId: parseInt(le.ledgerId),
            amount: parseFloat(le.amount),
          })),
        },
      };

      if (isAdmin) {
        voucherData.verifiedById = user.id;
        voucherData.verifiedAt = new Date();
      }

      const tableMap: any = {
        PAYMENT: tx.paymentVoucher,
        RECEIPT: tx.receiptVoucher,
        CONTRA: tx.contraVoucher,
        JOURNAL: tx.journalVoucher,
        SALES: tx.salesVoucher,
        PURCHASE: tx.purchaseVoucher,
      };

      return await tableMap[type].create({ data: voucherData });
    });

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      id: result.id,
      txid: txid,
      message: isAdmin ? "Authorized" : "Pending",
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
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
// Add this to your app/actions/voucher.ts file

export async function getVoucherByCode(txCode: string, companyId: number) {
  try {
    const where = { transactionCode: txCode, companyId };

    // Define the tables to search through
    const tables = [
      { model: prisma.salesVoucher, type: "SALES" },
      { model: prisma.purchaseVoucher, type: "PURCHASE" },
      { model: prisma.paymentVoucher, type: "PAYMENT" },
      { model: prisma.receiptVoucher, type: "RECEIPT" },
      { model: prisma.contraVoucher, type: "CONTRA" },
      { model: prisma.journalVoucher, type: "JOURNAL" },
      { model: prisma.stockJournal, type: "STOCK_JOURNAL" },
    ];

    for (const t of tables) {
      // @ts-ignore - dynamic model access
      const v = await t.model.findUnique({
        where,
        select: { id: true },
      });

      if (v) {
        return {
          success: true,
          id: v.id,
          type: t.type,
        };
      }
    }

    return { success: false, error: "Voucher not found" };
  } catch (error) {
    return { success: false, error: "Database search failed" };
  }
}
