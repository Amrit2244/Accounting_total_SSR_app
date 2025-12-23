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

// ✅ Define and Export State Type
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

      const totalAmt = parseFloat(data.totalAmount as string) || 0;
      const totalVal = parseFloat(data.totalVal as string) || 0;
      const taxVal = parseFloat(data.taxVal as string) || 0;

      const ledgerEntries = [
        {
          ledgerId: parseInt(partyLedgerId!),
          amount: type === "SALES" ? Math.abs(totalAmt) : -Math.abs(totalAmt),
        },
        {
          ledgerId: parseInt(salesPurchaseLedgerId!),
          amount: type === "SALES" ? -Math.abs(totalVal) : Math.abs(totalVal),
        },
      ];
      if (taxLedgerId) {
        ledgerEntries.push({
          ledgerId: parseInt(taxLedgerId),
          amount: type === "SALES" ? -Math.abs(taxVal) : Math.abs(taxVal),
        });
      }

      const commonData = {
        companyId: cid,
        voucherNo,
        date: d,
        narration,
        transactionCode,
        totalAmount: totalAmt,
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
                ? Math.abs(parseFloat(e.amount))
                : -Math.abs(parseFloat(e.amount)),
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
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: "Unauthorized" };

  const voucherId = parseInt(formData.get("voucherId") as string);
  const type = (formData.get("type") as string).toUpperCase();
  const date = new Date(formData.get("date") as string);
  const narration = formData.get("narration") as string;
  const companyId = parseInt(formData.get("companyId") as string);

  const rows = formData.get("rows")
    ? JSON.parse(formData.get("rows") as string)
    : [];
  const inventoryRows = formData.get("inventoryRows")
    ? JSON.parse(formData.get("inventoryRows") as string)
    : [];

  const partyLedgerId = formData.get("partyLedgerId")
    ? parseInt(formData.get("partyLedgerId") as string)
    : null;
  const salesPurchaseLedgerId = formData.get("salesPurchaseLedgerId")
    ? parseInt(formData.get("salesPurchaseLedgerId") as string)
    : null;
  const taxLedgerId = formData.get("taxLedgerId")
    ? parseInt(formData.get("taxLedgerId") as string)
    : null;

  const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0;
  const totalVal = parseFloat(formData.get("totalVal") as string) || 0;
  const taxVal = parseFloat(formData.get("taxVal") as string) || 0;

  const newTxCode = Math.floor(10000 + Math.random() * 90000).toString();

  try {
    // ✅ FIXED: Explicitly typed 'tx: any'
    await prisma.$transaction(async (tx: any) => {
      let ledgerData = [];
      let inventoryData = [];

      if (type === "SALES" || type === "PURCHASE") {
        ledgerData.push({
          ledgerId: partyLedgerId!,
          amount:
            type === "SALES" ? Math.abs(totalAmount) : -Math.abs(totalAmount),
        });
        ledgerData.push({
          ledgerId: salesPurchaseLedgerId!,
          amount: type === "SALES" ? -Math.abs(totalVal) : Math.abs(totalVal),
        });
        if (taxLedgerId) {
          ledgerData.push({
            ledgerId: taxLedgerId,
            amount: type === "SALES" ? -Math.abs(taxVal) : Math.abs(taxVal),
          });
        }

        inventoryData = inventoryRows.map((i: any) => ({
          stockItemId: parseInt(i.itemId),
          quantity:
            type === "SALES"
              ? -Math.abs(parseFloat(i.qty))
              : Math.abs(parseFloat(i.qty)),
          rate: parseFloat(i.rate),
          amount: parseFloat(i.qty) * parseFloat(i.rate),
          unit: "",
        }));
      } else {
        ledgerData = rows.map((e: any) => ({
          ledgerId: parseInt(e.ledgerId),
          amount:
            e.type === "Dr"
              ? Math.abs(parseFloat(e.amount))
              : -Math.abs(parseFloat(e.amount)),
        }));
      }

      const updateData = {
        date,
        narration,
        totalAmount: Math.abs(totalAmount),
        transactionCode: newTxCode,
        createdById: currentUserId,
        verifiedById: null,
        status: "PENDING",
        updatedAt: new Date(),
      };

      const tableMap: Record<string, any> = {
        SALES: tx.salesVoucher,
        PURCHASE: tx.purchaseVoucher,
        PAYMENT: tx.paymentVoucher,
        RECEIPT: tx.receiptVoucher,
        CONTRA: tx.contraVoucher,
        JOURNAL: tx.journalVoucher,
      };

      const dbTable = tableMap[type];
      if (dbTable) {
        await dbTable.update({
          where: { id: voucherId },
          data: {
            ...updateData,
            ledgerEntries: { deleteMany: {}, create: ledgerData },
            ...(inventoryData.length > 0 && {
              inventoryEntries: { deleteMany: {}, create: inventoryData },
            }),
          },
        });
      }
    });

    revalidatePath(`/companies/${companyId}/vouchers`);
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { error: "Update Failed: " + e.message };
  }
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
// 6. GET VOUCHERS
// ==========================================
export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
) {
  const baseWhere: any = { companyId };
  if (startDate && endDate) baseWhere.date = { gte: startDate, lte: endDate };

  const includeEntries = {
    ledgerEntries: { include: { ledger: { select: { name: true } } } },
  };

  try {
    const [sales, purchase, payment, receipt, contra, journal, stockJournal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ...includeEntries, partyLedger: true },
        }),
        prisma.purchaseVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: { ...includeEntries, partyLedger: true },
        }),
        prisma.paymentVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.receiptVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.contraVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.journalVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.stockJournal.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
        }),
      ]);

    const allVouchers = [
      ...sales.map((v: any) => ({
        ...v,
        type: "SALES",
        partyName: v.partyLedger?.name || v.partyName,
        entries: v.ledgerEntries,
      })),
      ...purchase.map((v: any) => ({
        ...v,
        type: "PURCHASE",
        partyName: v.partyLedger?.name || v.partyName,
        entries: v.ledgerEntries,
      })),
      ...payment.map((v: any) => ({
        ...v,
        type: "PAYMENT",
        entries: v.ledgerEntries,
      })),
      ...receipt.map((v: any) => ({
        ...v,
        type: "RECEIPT",
        entries: v.ledgerEntries,
      })),
      ...contra.map((v: any) => ({
        ...v,
        type: "CONTRA",
        entries: v.ledgerEntries,
      })),
      ...journal.map((v: any) => ({
        ...v,
        type: "JOURNAL",
        entries: v.ledgerEntries,
      })),
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
    return [];
  }
}

// ==========================================
// 7. FIND VOUCHER BY TXID
// ==========================================
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
    return { error: "Database error during search." };
  }
}

// ==========================================
// 8. GET FULL VOUCHER BY CODE
// ==========================================
export async function getVoucherByCode(code: string, companyId: number) {
  const where = { transactionCode: code, companyId };
  const rel = {
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
    inventoryEntries: { include: { stockItem: true } },
    createdBy: { select: { id: true, name: true } },
  };

  const sales = await prisma.salesVoucher.findFirst({ where, include: rel });
  if (sales)
    return {
      ...sales,
      type: "SALES",
      inventory: sales.inventoryEntries,
      entries: sales.ledgerEntries,
    };

  const purchase = await prisma.purchaseVoucher.findFirst({
    where,
    include: rel,
  });
  if (purchase)
    return {
      ...purchase,
      type: "PURCHASE",
      inventory: purchase.inventoryEntries,
      entries: purchase.ledgerEntries,
    };

  const payment = await prisma.paymentVoucher.findFirst({
    where,
    include: { ledgerEntries: rel.ledgerEntries, createdBy: true },
  });
  if (payment)
    return {
      ...payment,
      type: "PAYMENT",
      inventory: [],
      entries: payment.ledgerEntries,
    };

  const receipt = await prisma.receiptVoucher.findFirst({
    where,
    include: { ledgerEntries: rel.ledgerEntries, createdBy: true },
  });
  if (receipt)
    return {
      ...receipt,
      type: "RECEIPT",
      inventory: [],
      entries: receipt.ledgerEntries,
    };

  const contra = await prisma.contraVoucher.findFirst({
    where,
    include: { ledgerEntries: rel.ledgerEntries, createdBy: true },
  });
  if (contra)
    return {
      ...contra,
      type: "CONTRA",
      inventory: [],
      entries: contra.ledgerEntries,
    };

  const journal = await prisma.journalVoucher.findFirst({
    where,
    include: { ledgerEntries: rel.ledgerEntries, createdBy: true },
  });
  if (journal)
    return {
      ...journal,
      type: "JOURNAL",
      inventory: [],
      entries: journal.ledgerEntries,
    };

  const stock = await prisma.stockJournal.findFirst({
    where,
    include: {
      inventoryEntries: { include: { stockItem: true } },
      createdBy: true,
    },
  });
  if (stock)
    return {
      ...stock,
      type: "STOCK_JOURNAL",
      inventory: stock.inventoryEntries,
      entries: [],
      voucherNo: "STK-" + stock.id,
    };

  return null;
}

// ==========================================
// 9. BULK DELETE
// ==========================================
export async function deleteBulkVouchers(
  items: { id: number; type: string }[],
  companyId: number
) {
  if (!items || items.length === 0) return { error: "No items selected" };

  const salesIds = items.filter((i) => i.type === "SALES").map((i) => i.id);
  const purchaseIds = items
    .filter((i) => i.type === "PURCHASE")
    .map((i) => i.id);
  const paymentIds = items.filter((i) => i.type === "PAYMENT").map((i) => i.id);
  const receiptIds = items.filter((i) => i.type === "RECEIPT").map((i) => i.id);
  const contraIds = items.filter((i) => i.type === "CONTRA").map((i) => i.id);
  const journalIds = items.filter((i) => i.type === "JOURNAL").map((i) => i.id);
  const stockJournalIds = items
    .filter((i) => i.type === "STOCK_JOURNAL")
    .map((i) => i.id);

  try {
    await prisma.$transaction(
      async (tx: any) => {
        if (salesIds.length > 0)
          await tx.salesVoucher.deleteMany({ where: { id: { in: salesIds } } });
        if (purchaseIds.length > 0)
          await tx.purchaseVoucher.deleteMany({
            where: { id: { in: purchaseIds } },
          });
        if (paymentIds.length > 0)
          await tx.paymentVoucher.deleteMany({
            where: { id: { in: paymentIds } },
          });
        if (receiptIds.length > 0)
          await tx.receiptVoucher.deleteMany({
            where: { id: { in: receiptIds } },
          });
        if (contraIds.length > 0)
          await tx.contraVoucher.deleteMany({
            where: { id: { in: contraIds } },
          });
        if (journalIds.length > 0)
          await tx.journalVoucher.deleteMany({
            where: { id: { in: journalIds } },
          });
        if (stockJournalIds.length > 0)
          await tx.stockJournal.deleteMany({
            where: { id: { in: stockJournalIds } },
          });
      },
      { timeout: 20000 }
    );

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      message: `Successfully deleted ${items.length} vouchers.`,
    };
  } catch (error: any) {
    return { success: false, message: "Database Error: " + error.message };
  }
}
