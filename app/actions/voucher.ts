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
export async function createVoucher(prevState: any, formData: FormData) {
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

  // File Upload
  const file = formData.get("attachment") as File;
  let attachmentUrl = null;
  if (file && file.size > 0) attachmentUrl = await uploadFile(file);

  let finalVoucherNo = "";
  let createdId = 0;

  try {
    // --- CASE A: SALES & PURCHASE ---
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
    }

    // --- CASE B: OTHER VOUCHERS (Payment, Receipt, Contra, Journal) ---
    else {
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
    if (err.code === "P2002") {
      return { error: `Voucher Number already exists.` };
    }
    return { error: err.message || "Failed to save voucher" };
  }
}

// ==========================================
// 2. UPDATE VOUCHER (Maker-Checker Reset)
// ==========================================
export async function updateVoucher(prevState: any, formData: FormData) {
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

  let db: any;
  if (type === "SALES") db = prisma.salesVoucher;
  else if (type === "PURCHASE") db = prisma.purchaseVoucher;
  else if (type === "PAYMENT") db = prisma.paymentVoucher;
  else if (type === "RECEIPT") db = prisma.receiptVoucher;
  else if (type === "CONTRA") db = prisma.contraVoucher;
  else if (type === "JOURNAL") db = prisma.journalVoucher;

  if (!db) return { error: "Invalid Voucher Type" };

  try {
    await prisma.$transaction(async (tx: any) => {
      if (type === "SALES" || type === "PURCHASE") {
        await tx.ledgerEntry.deleteMany({
          where: { [type.toLowerCase() + "Id"]: voucherId },
        });
        await tx.inventoryEntry.deleteMany({
          where: { [type.toLowerCase() + "Id"]: voucherId },
        });
      } else {
        await tx.ledgerEntry.deleteMany({
          where: { [type.toLowerCase() + "Id"]: voucherId },
        });
      }

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

      const updatePayload: any = {
        date,
        narration,
        totalAmount,
        transactionCode: newTxCode,
        createdById: currentUserId,
        verifiedById: null,
        status: "PENDING",
        updatedAt: new Date(),
        ledgerEntries: { create: ledgerData },
      };

      if (inventoryData.length > 0) {
        updatePayload.inventoryEntries = { create: inventoryData };
      }

      await db.update({
        where: { id: voucherId },
        data: updatePayload,
      });
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
    if (type === "SALES")
      await prisma.salesVoucher.delete({ where: { id: voucherId } });
    else if (type === "PURCHASE")
      await prisma.purchaseVoucher.delete({ where: { id: voucherId } });
    else if (type === "PAYMENT")
      await prisma.paymentVoucher.delete({ where: { id: voucherId } });
    else if (type === "RECEIPT")
      await prisma.receiptVoucher.delete({ where: { id: voucherId } });
    else if (type === "CONTRA")
      await prisma.contraVoucher.delete({ where: { id: voucherId } });
    else if (type === "JOURNAL")
      await prisma.journalVoucher.delete({ where: { id: voucherId } });
    else if (type === "STOCK_JOURNAL")
      await prisma.stockJournal.delete({ where: { id: voucherId } });

    return { success: true };
  } catch (e) {
    return { error: "Delete Failed." };
  }
}

// ==========================================
// 4. VERIFY VOUCHER (Maker-Checker Enforced)
// ==========================================
export async function verifyVoucher(voucherId: number, type: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const t = type.toUpperCase();
  let db: any = null;

  if (t === "SALES") db = prisma.salesVoucher;
  else if (t === "PURCHASE") db = prisma.purchaseVoucher;
  else if (t === "PAYMENT") db = prisma.paymentVoucher;
  else if (t === "RECEIPT") db = prisma.receiptVoucher;
  else if (t === "CONTRA") db = prisma.contraVoucher;
  else if (t === "JOURNAL") db = prisma.journalVoucher;
  else if (t === "STOCK_JOURNAL") db = prisma.stockJournal;

  if (!db) return { error: "Invalid Type" };

  try {
    const voucher = await db.findUnique({
      where: { id: voucherId },
      select: { createdById: true, status: true },
    });

    if (!voucher) return { error: "Voucher not found" };

    if (voucher.createdById === userId) {
      return {
        error: "Security Rule: You cannot verify a voucher you created.",
      };
    }

    if (voucher.status === "APPROVED") {
      return { error: "Already Approved" };
    }

    await db.update({
      where: { id: voucherId },
      data: {
        status: "APPROVED",
        verifiedById: userId,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (e) {
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

  const updateData = {
    status: "REJECTED",
    rejectionReason: reason,
    updatedAt: new Date(),
  };

  const t = type.toUpperCase();
  let db: any = null;

  if (t === "SALES") db = prisma.salesVoucher;
  else if (t === "PURCHASE") db = prisma.purchaseVoucher;
  else if (t === "PAYMENT") db = prisma.paymentVoucher;
  else if (t === "RECEIPT") db = prisma.receiptVoucher;
  else if (t === "CONTRA") db = prisma.contraVoucher;
  else if (t === "JOURNAL") db = prisma.journalVoucher;

  try {
    if (db) await db.update({ where: { id: voucherId }, data: updateData });
    return { success: true };
  } catch (e) {
    return { error: "Rejection Failed" };
  }
}

// ==========================================
// 6. GET VOUCHERS (Aggregator + Search)
// ==========================================
export async function getVouchers(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
) {
  // 1. Define base filters (Company + Dates)
  const baseWhere: any = { companyId };
  if (startDate && endDate) {
    baseWhere.date = { gte: startDate, lte: endDate };
  }

  // 2. Prepare Search Filter
  let searchFilter: any = {};
  if (searchQuery) {
    searchFilter = {
      OR: [
        { transactionCode: { contains: searchQuery } },
        { narration: { contains: searchQuery } },
        {
          ledgerEntries: {
            some: {
              ledger: {
                name: { contains: searchQuery },
              },
            },
          },
        },
        // We add voucherNo as a string search here
        { voucherNo: { contains: searchQuery } },
      ],
    };
  }

  // 3. Prepare Integer-specific Filter for tables where voucherNo is Int
  // (Payment, Receipt, Contra, Journal often use Auto-Increment Ints)
  let searchFilterWithInt: any = { ...searchFilter };
  if (searchQuery) {
    const searchNumber = parseInt(searchQuery);
    if (!isNaN(searchNumber)) {
      // Create a specific filter for Integer tables
      searchFilterWithInt = {
        OR: [
          ...searchFilter.OR.filter((condition: any) => !condition.voucherNo), // Remove the String version
          { voucherNo: searchNumber }, // Add the Integer version
          { transactionCode: { contains: searchQuery } },
          { narration: { contains: searchQuery } },
          {
            ledgerEntries: {
              some: { ledger: { name: { contains: searchQuery } } },
            },
          },
        ],
      };
    } else {
      // If it's not a number, remove voucherNo from Integer tables to prevent crash
      searchFilterWithInt = {
        OR: searchFilter.OR.filter((condition: any) => !condition.voucherNo),
      };
    }
  }

  const includeEntries = {
    ledgerEntries: {
      include: { ledger: { select: { name: true } } },
    },
  };

  try {
    const [sales, purchase, payment, receipt, contra, journal, stockJournal] =
      await Promise.all([
        // SALES & PURCHASE: Usually String voucherNo
        prisma.salesVoucher.findMany({
          where: { ...baseWhere, ...searchFilter },
          orderBy: { date: "desc" },
          include: { ...includeEntries, partyLedger: true },
        }),
        prisma.purchaseVoucher.findMany({
          where: { ...baseWhere, ...searchFilter },
          orderBy: { date: "desc" },
          include: { ...includeEntries, partyLedger: true },
        }),
        // PAYMENT, RECEIPT, CONTRA, JOURNAL: Check if your schema uses Int
        prisma.paymentVoucher.findMany({
          where: { ...baseWhere, ...searchFilterWithInt },
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.receiptVoucher.findMany({
          where: { ...baseWhere, ...searchFilterWithInt },
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.contraVoucher.findMany({
          where: { ...baseWhere, ...searchFilterWithInt },
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.journalVoucher.findMany({
          where: { ...baseWhere, ...searchFilterWithInt },
          orderBy: { date: "desc" },
          include: includeEntries,
        }),
        prisma.stockJournal.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
        }),
      ]);

    const allVouchers = [
      ...sales.map((v) => ({
        ...v,
        type: "SALES",
        partyName: v.partyLedger?.name || v.partyName,
        entries: v.ledgerEntries,
      })),
      ...purchase.map((v) => ({
        ...v,
        type: "PURCHASE",
        partyName: v.partyLedger?.name || v.partyName,
        entries: v.ledgerEntries,
      })),
      ...payment.map((v) => ({
        ...v,
        type: "PAYMENT",
        partyName: null,
        entries: v.ledgerEntries,
      })),
      ...receipt.map((v) => ({
        ...v,
        type: "RECEIPT",
        partyName: null,
        entries: v.ledgerEntries,
      })),
      ...contra.map((v) => ({
        ...v,
        type: "CONTRA",
        partyName: null,
        entries: v.ledgerEntries,
      })),
      ...journal.map((v) => ({
        ...v,
        type: "JOURNAL",
        partyName: null,
        entries: v.ledgerEntries,
      })),
      ...stockJournal.map((v) => ({
        ...v,
        type: "STOCK_JOURNAL",
        totalAmount: 0,
        partyName: null,
        entries: [],
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allVouchers;
  } catch (error) {
    console.error("Search Error:", error);
    return []; // Return empty array so UI doesn't crash
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
