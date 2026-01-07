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
  code?: string;
};

// --- HELPER: GENERATE TRULY UNIQUE TXID ---
async function generateUniqueTXID(): Promise<string> {
  let digits = 5;
  let attempts = 0;

  while (true) {
    const candidate = Math.floor(
      Math.pow(10, digits - 1) + Math.random() * 90000
    ).toString();

    const results = await Promise.all([
      prisma.salesVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.purchaseVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.paymentVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.receiptVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.contraVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.journalVoucher.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
      prisma.stockJournal.findUnique({
        where: { transactionCode: candidate },
        select: { id: true },
      }),
    ]);

    const isTaken = results.some((r) => r !== null);

    if (!isTaken) {
      return candidate;
    }

    attempts++;
    if (attempts > 10) digits++;
  }
}

// --- HELPER: GET USER ---
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
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

// --- UPDATE VOUCHER ---
export async function updateVoucher(
  voucherId: number,
  companyId: number,
  type: string,
  data: any
): Promise<State> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const t = type.toUpperCase();
    const newTxid = await generateUniqueTXID();
    const isAdmin = user.role === "ADMIN";

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
      message: isAdmin ? "Updated and Authorized" : "Updated and Pending",
      txid: newTxid,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- VERIFY VOUCHER ---
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

    await tableMap[t].update({
      where: { id: voucherId },
      data: {
        status: "APPROVED",
        verifiedById: user.id,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/");
    return { success: true, message: "Verified Successfully." };
  } catch (error: any) {
    return { success: false, error: "Verification failed." };
  }
}

// --- GET VOUCHERS ---
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
    const invInclude = {
      ...commonInclude,
      inventoryEntries: { include: { stockItem: true } },
    };

    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: invInclude,
        }),
        prisma.purchaseVoucher.findMany({
          where: baseWhere,
          orderBy: { date: "desc" },
          include: invInclude,
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
      const entries = v.ledgerEntries || [];
      const drEntries = entries.filter((e: any) => e.amount < 0);
      const crEntries = entries.filter((e: any) => e.amount > 0);
      const joinNames = (arr: any[]) =>
        arr.map((e) => e.ledger?.name || "Unknown").join(" & ");

      let drLabel = "—";
      let crLabel = "—";

      if (type === "SALES") {
        drLabel = joinNames(drEntries) || v.partyName;
        crLabel = joinNames(crEntries) || "Sales Account";
      } else if (type === "PURCHASE") {
        drLabel = joinNames(drEntries) || "Purchase Account";
        crLabel = joinNames(crEntries) || v.partyName;
      } else {
        drLabel = joinNames(drEntries);
        crLabel = joinNames(crEntries);
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

    let result = all.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.voucherNo.toString().includes(q) ||
          v.displayParticulars.toLowerCase().includes(q) ||
          v.narration?.toLowerCase().includes(q)
      );
    }
    return result;
  } catch (e) {
    return [];
  }
}

// --- CREATE VOUCHER (BRUTE FORCE RECOVERY) ---
export async function createVoucher(
  prevState: any,
  formData: FormData
): Promise<State> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized access." };

    const isAdmin = user.role === "ADMIN";
    const companyId = parseInt(formData.get("companyId") as string);
    const type = ((formData.get("type") as string) || "").toUpperCase();
    const date = new Date(formData.get("date") as string);
    const narration = (formData.get("narration") as string) || "";
    const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0;

    const txid = await generateUniqueTXID();

    let ledgerData: any[] = [];
    let inventoryData: any[] = [];

    // CASE A: SALES / PURCHASE
    if (type === "SALES" || type === "PURCHASE") {
      const partyId = parseInt(formData.get("partyLedgerId") as string);
      const accountId = parseInt(
        formData.get("salesPurchaseLedgerId") as string
      );
      const taxId = formData.get("taxLedgerId")
        ? parseInt(formData.get("taxLedgerId") as string)
        : null;
      const totalVal = parseFloat(formData.get("totalVal") as string) || 0;
      const taxVal = parseFloat(formData.get("taxVal") as string) || 0;

      const rawInventory = formData.get("inventoryRows") as string;
      inventoryData = JSON.parse(rawInventory || "[]");

      if (type === "SALES") {
        ledgerData.push({ ledgerId: partyId, amount: -Math.abs(totalAmount) });
        ledgerData.push({ ledgerId: accountId, amount: Math.abs(totalVal) });
        if (taxId && taxVal > 0)
          ledgerData.push({ ledgerId: taxId, amount: Math.abs(taxVal) });
      } else {
        ledgerData.push({ ledgerId: partyId, amount: Math.abs(totalAmount) });
        ledgerData.push({ ledgerId: accountId, amount: -Math.abs(totalVal) });
        if (taxId && taxVal > 0)
          ledgerData.push({ ledgerId: taxId, amount: -Math.abs(taxVal) });
      }
    }
    // CASE B: OTHER VOUCHERS
    else {
      const rawLedgers = formData.get("ledgerEntries") as string;
      ledgerData = JSON.parse(rawLedgers || "[]");
    }

    if (ledgerData.length < 2) {
      return {
        success: false,
        error: "Invalid data. At least 2 ledgers required.",
      };
    }

    // --- TRANSACTION WITH BRUTE FORCE RECOVERY ---
    const result = await prisma.$transaction(async (tx) => {
      const tableMap: any = {
        PAYMENT: tx.paymentVoucher,
        RECEIPT: tx.receiptVoucher,
        CONTRA: tx.contraVoucher,
        JOURNAL: tx.journalVoucher,
        SALES: tx.salesVoucher,
        PURCHASE: tx.purchaseVoucher,
        STOCK_JOURNAL: tx.stockJournal,
      };

      const model = tableMap[type];
      if (!model) throw new Error(`Invalid Voucher Type: ${type}`);

      let nextNo = 0;
      let isUnique = false;
      let attempts = 0;

      // Retries up to 10 times
      while (!isUnique && attempts < 10) {
        // 1. Get next number from Sequence
        const seq = await tx.voucherSequence.upsert({
          where: { companyId_voucherType: { companyId, voucherType: type } },
          update: { lastNo: { increment: 1 } },
          create: { companyId, voucherType: type, lastNo: 1 },
        });
        nextNo = seq.lastNo;

        // 2. Check if this number is already used in the Table
        const existing = await model.findFirst({
          where: {
            companyId,
            voucherNo:
              type === "SALES" || type === "PURCHASE"
                ? nextNo.toString()
                : nextNo,
          },
        });

        if (!existing) {
          isUnique = true;
        } else {
          // 3. COLLISION DETECTED: BRUTE FORCE SCAN
          // We fetch ALL voucher numbers to find the TRUE max, ignoring text sorting issues.
          console.warn(
            `[Voucher Fix] Collision on #${nextNo}. Scanning all vouchers...`
          );

          // Lightweight query: only fetch voucherNo
          const allVouchers = await model.findMany({
            where: { companyId },
            select: { voucherNo: true },
          });

          // Calculate Max Integer safely in JS
          let maxVal = 0;
          for (const v of allVouchers) {
            const num = parseInt(String(v.voucherNo).replace(/\D/g, "")); // Strip non-digits
            if (!isNaN(num) && num > maxVal) {
              maxVal = num;
            }
          }

          // If the Sequence table is behind the real data, jump it forward
          if (maxVal >= nextNo) {
            console.warn(
              `[Voucher Fix] Jumping sequence from ${nextNo} to ${maxVal}`
            );
            await tx.voucherSequence.update({
              where: {
                companyId_voucherType: { companyId, voucherType: type },
              },
              data: { lastNo: maxVal }, // Next loop iteration will do +1, so it becomes maxVal + 1
            });
          }
          attempts++;
        }
      }

      if (!isUnique)
        throw new Error(
          `Failed to generate unique voucher number after ${attempts} attempts. System is congested.`
        );

      // Create Object
      const voucherData: any = {
        companyId,
        voucherNo:
          type === "SALES" || type === "PURCHASE" ? nextNo.toString() : nextNo,
        transactionCode: txid,
        date,
        narration,
        totalAmount,
        createdById: user.id,
        status: isAdmin ? "APPROVED" : "PENDING",
        ledgerEntries: {
          create: ledgerData.map((e) => ({
            ledgerId: parseInt(e.ledgerId.toString()),
            amount: parseFloat(e.amount.toString()),
          })),
        },
      };

      if (
        inventoryData.length > 0 &&
        (type === "SALES" || type === "PURCHASE")
      ) {
        voucherData.inventoryEntries = {
          create: inventoryData.map((item: any) => ({
            stockItemId: parseInt(item.itemId),
            quantity: parseFloat(item.qty),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.amount),
          })),
        };
      }

      if (isAdmin) {
        voucherData.verifiedById = user.id;
        voucherData.verifiedAt = new Date();
      }

      return await model.create({ data: voucherData });
    });

    revalidatePath(`/companies/${companyId}/vouchers`);

    return {
      success: true,
      id: result.id,
      code: result.voucherNo.toString(),
      txid: txid,
      message: isAdmin ? "Authorized" : "Pending",
    };
  } catch (error: any) {
    console.error("Cloud Create Voucher Error:", {
      msg: error.message,
      stack: error.stack,
      code: error.code,
    });
    return {
      success: false,
      error: `System Error: ${error.message || "Failed to create voucher"}`,
    };
  }
}

// ... delete and getByCode (unchanged) ...
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

export async function getVoucherByCode(txCode: string, companyId: number) {
  try {
    const where = { transactionCode: txCode, companyId };
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
      // @ts-ignore
      const v = await t.model.findUnique({ where, select: { id: true } });
      if (v) return { success: true, id: v.id, type: t.type };
    }
    return { success: false, error: "Voucher not found" };
  } catch (error) {
    return { success: false, error: "Database search failed" };
  }
}
