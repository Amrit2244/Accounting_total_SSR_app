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

// --- Auth Helper ---
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
// --- Schemas ---
const VoucherSchema = z.object({
  date: z.string().min(1),
  type: z.enum([
    "CONTRA",
    "PAYMENT",
    "RECEIPT",
    "JOURNAL",
    "SALES",
    "PURCHASE",
  ]),
  narration: z.string().optional(),
  voucherNo: z.string().optional(),
  companyId: z.string(),
  rows: z.string().optional(),
  inventoryRows: z.string().optional(),
  partyLedgerId: z.string().optional(),
  salesPurchaseLedgerId: z.string().optional(),
  taxLedgerId: z.string().optional(),
  totalAmount: z.string().optional(),
  totalVal: z.string().optional(),
  taxVal: z.string().optional(),
});

// --- Helper: Auto Numbering ---
async function getNextAutoNumber(companyId: number, type: string) {
  const seq = await prisma.voucherSequence.upsert({
    where: { companyId_voucherType: { companyId, voucherType: type } },
    update: { lastNo: { increment: 1 } },
    create: { companyId, voucherType: type, lastNo: 1 },
  });
  return seq.lastNo;
}

// ==========================================
// 1. CREATE VOUCHER ACTION
// ==========================================
export async function createVoucher(
  prevState: State,
  formData: FormData
): Promise<State> {
  const data = Object.fromEntries(formData);
  const result = VoucherSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const {
    date,
    type,
    narration,
    voucherNo,
    companyId,
    rows,
    inventoryRows,
    partyLedgerId,
    salesPurchaseLedgerId,
    taxLedgerId,
    totalAmount,
    totalVal,
    taxVal,
  } = result.data;

  const cid = parseInt(companyId);
  const d = new Date(date);
  const transactionCode = Math.floor(10000 + Math.random() * 90000).toString();

  let finalVoucherNo = "";
  let createdId = 0;

  try {
    if (type === "SALES" || type === "PURCHASE") {
      if (!voucherNo) return { error: "Voucher Number is required" };
      finalVoucherNo = voucherNo;

      const invItems = inventoryRows
        ? JSON.parse(inventoryRows).map((i: any) => ({
            stockItemId: parseInt(i.itemId),
            quantity:
              type === "SALES"
                ? -Math.abs(parseFloat(i.qty) || 0)
                : Math.abs(parseFloat(i.qty) || 0),
            rate: parseFloat(i.rate) || 0,
            amount: (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0),
            unit: "",
          }))
        : [];

      const tAmt = parseFloat(totalAmount as string) || 0;
      const tVal = parseFloat(totalVal as string) || 0;
      const tTax = parseFloat(taxVal as string) || 0;

      // Manual Entry Logic
      const ledgerEntries = [
        {
          ledgerId: parseInt(partyLedgerId!),
          amount: type === "SALES" ? -Math.abs(tAmt) : Math.abs(tAmt),
        },
        {
          ledgerId: parseInt(salesPurchaseLedgerId!),
          amount: type === "SALES" ? Math.abs(tVal) : -Math.abs(tVal),
        },
      ];
      if (taxLedgerId) {
        ledgerEntries.push({
          ledgerId: parseInt(taxLedgerId),
          amount: type === "SALES" ? Math.abs(tTax) : -Math.abs(tTax),
        });
      }

      const commonData = {
        companyId: cid,
        voucherNo,
        date: d,
        narration,
        transactionCode,
        totalAmount: tAmt,
        status: "PENDING",
        createdById: userId,
        ledgerEntries: { create: ledgerEntries },
        inventoryEntries: { create: invItems },
      };

      let res;
      if (type === "SALES")
        res = await prisma.salesVoucher.create({ data: commonData });
      else res = await prisma.purchaseVoucher.create({ data: commonData });
      createdId = res.id;
    } else {
      const autoNo = await getNextAutoNumber(cid, type);
      finalVoucherNo = autoNo.toString();

      const entries = rows
        ? JSON.parse(rows).map((e: any) => ({
            ledgerId: parseInt(e.ledgerId),
            amount:
              e.type === "Dr"
                ? -Math.abs(parseFloat(e.amount))
                : Math.abs(parseFloat(e.amount)),
          }))
        : [];

      const total =
        entries.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0) /
        2;

      const commonData = {
        companyId: cid,
        voucherNo: autoNo,
        date: d,
        narration,
        transactionCode,
        totalAmount: total,
        status: "PENDING",
        createdById: userId,
        ledgerEntries: { create: entries },
      };

      let res;
      if (type === "PAYMENT")
        res = await prisma.paymentVoucher.create({ data: commonData });
      else if (type === "RECEIPT")
        res = await prisma.receiptVoucher.create({ data: commonData });
      else if (type === "CONTRA")
        res = await prisma.contraVoucher.create({ data: commonData });
      else if (type === "JOURNAL")
        res = await prisma.journalVoucher.create({ data: commonData });

      if (res) createdId = res.id;
    }

    revalidatePath(`/companies/${cid}/vouchers`);
    return {
      success: true,
      code: finalVoucherNo,
      txid: transactionCode,
      id: createdId,
    };
  } catch (err: any) {
    console.error("Voucher Creation Error:", err);
    return { error: err.message || "Failed to save voucher" };
  }
}

// ==========================================
// 2. UPDATE VOUCHER
// ==========================================
export async function updateVoucher(
  prevState: State,
  formData: FormData
): Promise<State> {
  return { success: true };
}

// ==========================================
// 3. DELETE VOUCHER
// ==========================================
export async function deleteVoucher(voucherId: number, type: string) {
  try {
    const t = type.toUpperCase();
    const tableMap: Record<string, any> = {
      SALES: prisma.salesVoucher,
      PURCHASE: prisma.purchaseVoucher,
      PAYMENT: prisma.paymentVoucher,
      RECEIPT: prisma.receiptVoucher,
      CONTRA: prisma.contraVoucher,
      JOURNAL: prisma.journalVoucher,
      STOCK_JOURNAL: prisma.stockJournal,
    };

    const dbTable = tableMap[t];
    if (dbTable) {
      await dbTable.delete({ where: { id: voucherId } });
    }
    return { success: true };
  } catch (e: any) {
    return { error: "Delete Failed: " + e.message };
  }
}

// ==========================================
// 4. VERIFY VOUCHER
// ==========================================
export async function verifyVoucher(voucherId: number, type: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const t = type.toUpperCase();
  const tableMap: Record<string, any> = {
    SALES: prisma.salesVoucher,
    PURCHASE: prisma.purchaseVoucher,
    PAYMENT: prisma.paymentVoucher,
    RECEIPT: prisma.receiptVoucher,
    CONTRA: prisma.contraVoucher,
    JOURNAL: prisma.journalVoucher,
    STOCK_JOURNAL: prisma.stockJournal,
  };

  const dbTable = tableMap[t];
  if (!dbTable) return { error: "Invalid Type" };

  try {
    const voucher = await dbTable.findUnique({
      where: { id: voucherId },
      select: { createdById: true, status: true },
    });

    if (!voucher) return { error: "Voucher not found" };
    if (voucher.createdById === userId)
      return { error: "Security Rule: Maker cannot be Checker." };
    if (voucher.status === "APPROVED") return { error: "Already Approved" };

    await dbTable.update({
      where: { id: voucherId },
      data: { status: "APPROVED", verifiedById: userId, updatedAt: new Date() },
    });

    return { success: true };
  } catch (e: any) {
    return { error: "Verification Failed" };
  }
}

// ==========================================
// 5. REJECT VOUCHER
// ==========================================
export async function rejectVoucher(
  voucherId: number,
  type: string,
  reason: string
) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const t = type.toUpperCase();
  const tableMap: Record<string, any> = {
    SALES: prisma.salesVoucher,
    PURCHASE: prisma.purchaseVoucher,
    PAYMENT: prisma.paymentVoucher,
    RECEIPT: prisma.receiptVoucher,
    CONTRA: prisma.contraVoucher,
    JOURNAL: prisma.journalVoucher,
  };

  const dbTable = tableMap[t];
  if (!dbTable) return { error: "Invalid Type" };

  try {
    await dbTable.update({
      where: { id: voucherId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        updatedAt: new Date(),
      },
    });
    return { success: true };
  } catch (e: any) {
    return { error: "Rejection Failed" };
  }
}

// ==========================================
// 6. GET VOUCHERS (List View)
// ==========================================
export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
) {
  const baseWhere: any = { companyId };
  if (startDate && endDate) baseWhere.date = { gte: startDate, lte: endDate };

  // Fetch ledgers for display names
  const includeLedgers = {
    ledgerEntries: { include: { ledger: { select: { name: true } } } },
  };
  const includeWithInventory = {
    ...includeLedgers,
    inventoryEntries: true,
  };

  try {
    const [sales, purchase, payment, receipt, contra, journal, stockJournal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeWithInventory,
        }),
        prisma.purchaseVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeWithInventory,
        }),
        prisma.paymentVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeLedgers,
        }),
        prisma.receiptVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeLedgers,
        }),
        prisma.contraVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeLedgers,
        }),
        prisma.journalVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeLedgers,
        }),
        prisma.stockJournal.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
        }),
      ]);

    const formatVoucher = (v: any, type: string) => {
      let partyName = "—";
      let particularsLabel = "";

      const entries = v.ledgerEntries || [];

      if (entries.length > 0) {
        if (type === "SALES") {
          const pEntry = entries.find((e: any) => e.amount < 0);
          partyName = pEntry?.ledger?.name || "Cash";

          const sEntry = entries.find(
            (e: any) =>
              e.amount > 0 &&
              !e.ledger.name.toLowerCase().includes("tax") &&
              !e.ledger.name.toLowerCase().includes("duty") &&
              !e.ledger.name.toLowerCase().includes("gst")
          );

          if (sEntry) {
            const name = sEntry.ledger.name;
            if (name.match(/^sales\s*accounts?$/i)) {
              particularsLabel = "Sales A/c";
            } else {
              particularsLabel = name;
            }
          } else {
            particularsLabel = "Sales A/c";
          }
        } else if (type === "PURCHASE") {
          const pEntry = entries.find((e: any) => e.amount > 0);
          partyName = pEntry?.ledger?.name || "Cash";

          const sEntry = entries.find(
            (e: any) =>
              e.amount < 0 &&
              !e.ledger.name.toLowerCase().includes("tax") &&
              !e.ledger.name.toLowerCase().includes("duty")
          );

          if (sEntry) {
            const name = sEntry.ledger.name;
            if (name.match(/^purchase\s*accounts?$/i)) {
              particularsLabel = "Purchase A/c";
            } else {
              particularsLabel = name;
            }
          } else {
            particularsLabel = "Purchase A/c";
          }
        } else {
          const entry = entries.find(
            (e: any) =>
              !e.ledger?.name.toLowerCase().includes("cash") &&
              !e.ledger?.name.toLowerCase().includes("bank")
          );
          partyName = entry?.ledger?.name || entries[0]?.ledger?.name || "—";
        }
      }

      let uiEntries = entries.map((e: any) => ({
        ...e,
        amount: -e.amount,
      }));

      if (type === "SALES") {
        const hasCreditEntry = uiEntries.some((e: any) => e.amount < 0);
        if (!hasCreditEntry && v.totalAmount) {
          uiEntries.push({
            id: `virt-sales-${v.id}`,
            ledger: { name: particularsLabel },
            amount: -Math.abs(v.totalAmount),
          });
        }
      } else if (type === "PURCHASE") {
        const hasDebitEntry = uiEntries.some((e: any) => e.amount > 0);
        if (!hasDebitEntry && v.totalAmount) {
          uiEntries.push({
            id: `virt-purch-${v.id}`,
            ledger: { name: particularsLabel },
            amount: Math.abs(v.totalAmount),
          });
        }
      }

      return {
        ...v,
        type,
        partyName,
        displayParticulars: `${partyName} / ${particularsLabel}`,
        entries: uiEntries,
      };
    };

    const allVouchers = [
      ...sales.map((v: any) => formatVoucher(v, "SALES")),
      ...purchase.map((v: any) => formatVoucher(v, "PURCHASE")),
      ...payment.map((v: any) => formatVoucher(v, "PAYMENT")),
      ...receipt.map((v: any) => formatVoucher(v, "RECEIPT")),
      ...contra.map((v: any) => formatVoucher(v, "CONTRA")),
      ...journal.map((v: any) => formatVoucher(v, "JOURNAL")),
      ...stockJournal.map((v: any) => ({
        ...v,
        type: "STOCK_JOURNAL",
        totalAmount: 0,
        entries: [],
      })),
    ].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return allVouchers;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

// ==========================================
// 7. GET VOUCHER BY CODE (FIXED: Includes Inventory Fetch)
// ==========================================
export async function getVoucherByCode(txCode: string, companyId: number) {
  const where = { transactionCode: txCode, companyId };

  // ✅ Explicitly fetch Inventory + Stock Item Name
  const commonInclude = {
    createdBy: { select: { name: true } },
    ledgerEntries: {
      include: {
        ledger: { include: { group: true } },
      },
    },
    inventoryEntries: {
      include: { stockItem: true },
    },
  };

  // Check Sales
  const sales = await prisma.salesVoucher.findFirst({
    where,
    include: commonInclude,
  });
  if (sales)
    return {
      ...sales,
      type: "SALES",
      entries: sales.ledgerEntries,
      // Map inventory specifically to ensure it exists
      inventory: sales.inventoryEntries || [],
    };

  // Check Purchase
  const purchase = await prisma.purchaseVoucher.findFirst({
    where,
    include: commonInclude,
  });
  if (purchase)
    return {
      ...purchase,
      type: "PURCHASE",
      entries: purchase.ledgerEntries,
      inventory: purchase.inventoryEntries || [],
    };

  // Check Other Types (Ledger Only)
  const ledgerOnlyInclude = {
    createdBy: { select: { name: true } },
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
  };

  const payment = await prisma.paymentVoucher.findFirst({
    where,
    include: ledgerOnlyInclude,
  });
  if (payment)
    return {
      ...payment,
      type: "PAYMENT",
      entries: payment.ledgerEntries,
      inventory: [],
    };

  const receipt = await prisma.receiptVoucher.findFirst({
    where,
    include: ledgerOnlyInclude,
  });
  if (receipt)
    return {
      ...receipt,
      type: "RECEIPT",
      entries: receipt.ledgerEntries,
      inventory: [],
    };

  const contra = await prisma.contraVoucher.findFirst({
    where,
    include: ledgerOnlyInclude,
  });
  if (contra)
    return {
      ...contra,
      type: "CONTRA",
      entries: contra.ledgerEntries,
      inventory: [],
    };

  const journal = await prisma.journalVoucher.findFirst({
    where,
    include: ledgerOnlyInclude,
  });
  if (journal)
    return {
      ...journal,
      type: "JOURNAL",
      entries: journal.ledgerEntries,
      inventory: [],
    };

  return null;
}

export async function findVoucherByCode(txCode: string, companyId: number) {
  const where = { transactionCode: txCode, companyId };
  try {
    const sales = await prisma.salesVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (sales) return { success: true, id: sales.id, type: "SALES" };
    const purchase = await prisma.purchaseVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (purchase) return { success: true, id: purchase.id, type: "PURCHASE" };
    const payment = await prisma.paymentVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (payment) return { success: true, id: payment.id, type: "PAYMENT" };
    const receipt = await prisma.receiptVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (receipt) return { success: true, id: receipt.id, type: "RECEIPT" };
    const contra = await prisma.contraVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (contra) return { success: true, id: contra.id, type: "CONTRA" };
    const journal = await prisma.journalVoucher.findFirst({
      where,
      select: { id: true },
    });
    if (journal) return { success: true, id: journal.id, type: "JOURNAL" };
    const stock = await prisma.stockJournal.findFirst({
      where,
      select: { id: true },
    });
    if (stock) return { success: true, id: stock.id, type: "STOCK_JOURNAL" };
    return { error: "Invalid Transaction ID." };
  } catch (e) {
    return { error: "Database error." };
  }
}

export async function deleteBulkVouchers(
  items: any[],
  companyId: number
): Promise<State> {
  try {
    for (const item of items) {
      const typeMap: any = {
        SALES: prisma.salesVoucher,
        PURCHASE: prisma.purchaseVoucher,
        PAYMENT: prisma.paymentVoucher,
        RECEIPT: prisma.receiptVoucher,
        CONTRA: prisma.contraVoucher,
        JOURNAL: prisma.journalVoucher,
        STOCK_JOURNAL: prisma.stockJournal,
      };
      const db = typeMap[item.type.toUpperCase()];
      if (db) await db.delete({ where: { id: item.id } });
    }
    revalidatePath(`/companies/${companyId}/vouchers`);
    return { success: true, message: "Deleted successfully" };
  } catch (e: any) {
    return { success: false, message: e.message || "Delete failed" };
  }
}
