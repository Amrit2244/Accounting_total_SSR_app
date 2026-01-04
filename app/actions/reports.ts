"use server";

import { prisma } from "@/lib/prisma";

export async function getCashBookReport(
  companyId: number,
  ledgerId?: number,
  fromDate?: Date,
  toDate?: Date
) {
  try {
    // 1. Find Cash Ledgers
    const cashLedgers = await prisma.ledger.findMany({
      where: {
        companyId,
        group: { name: { contains: "Cash" } },
      },
      select: { id: true, name: true },
    });

    const activeLedgerId = ledgerId || cashLedgers[0]?.id;
    if (!activeLedgerId)
      return { cashLedgers, entries: [], openingBalance: 0, closingBalance: 0 };

    // --- 2. OPENING BALANCE QUERY ---
    // We must use the SPECIFIC relation name for each entry type (salesVoucher, paymentVoucher, etc.)
    const openingQuery = await prisma.ledger.findUnique({
      where: { id: activeLedgerId },
      select: {
        salesEntries: {
          where: {
            salesVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
        purchaseEntries: {
          where: {
            purchaseVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
        paymentEntries: {
          where: {
            paymentVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
        receiptEntries: {
          where: {
            receiptVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
        contraEntries: {
          where: {
            contraVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
        journalEntries: {
          where: {
            journalVoucher: { date: { lt: fromDate }, status: "APPROVED" },
          },
          select: { amount: true },
        },
      },
    });

    let openingBalance = 0;
    if (openingQuery) {
      Object.values(openingQuery).forEach((arr: any[]) => {
        if (Array.isArray(arr)) {
          openingBalance += arr.reduce(
            (sum, item) => sum + (item.amount || 0),
            0
          );
        }
      });
    }

    // --- 3. CURRENT TRANSACTIONS QUERY ---
    // We fetch full details. Note: We must explicitly include the voucher and its ledgerEntries using specific names.
    const currentQuery = await prisma.ledger.findUnique({
      where: { id: activeLedgerId },
      select: {
        salesEntries: {
          where: {
            salesVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            salesVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
        purchaseEntries: {
          where: {
            purchaseVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            purchaseVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
        paymentEntries: {
          where: {
            paymentVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            paymentVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
        receiptEntries: {
          where: {
            receiptVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            receiptVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
        contraEntries: {
          where: {
            contraVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            contraVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
        journalEntries: {
          where: {
            journalVoucher: {
              date: { gte: fromDate, lte: toDate },
              status: "APPROVED",
            },
          },
          include: {
            journalVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        },
      },
    });

    // --- 4. NORMALIZE DATA ---
    // Since 'salesEntries' has 'salesVoucher' and 'paymentEntries' has 'paymentVoucher',
    // we map them all to a common 'voucher' property for easy display.
    let allEntries: any[] = [];

    const normalize = (entries: any[], type: string, voucherKey: string) => {
      return entries.map((e) => ({
        ...e,
        voucher: e[voucherKey], // Map specific voucher key to generic 'voucher'
        type: type,
      }));
    };

    if (currentQuery) {
      if (currentQuery.salesEntries)
        allEntries.push(
          ...normalize(currentQuery.salesEntries, "SALES", "salesVoucher")
        );
      if (currentQuery.purchaseEntries)
        allEntries.push(
          ...normalize(
            currentQuery.purchaseEntries,
            "PURCHASE",
            "purchaseVoucher"
          )
        );
      if (currentQuery.paymentEntries)
        allEntries.push(
          ...normalize(currentQuery.paymentEntries, "PAYMENT", "paymentVoucher")
        );
      if (currentQuery.receiptEntries)
        allEntries.push(
          ...normalize(currentQuery.receiptEntries, "RECEIPT", "receiptVoucher")
        );
      if (currentQuery.contraEntries)
        allEntries.push(
          ...normalize(currentQuery.contraEntries, "CONTRA", "contraVoucher")
        );
      if (currentQuery.journalEntries)
        allEntries.push(
          ...normalize(currentQuery.journalEntries, "JOURNAL", "journalVoucher")
        );
    }

    // Sort by Date
    allEntries.sort(
      (a, b) =>
        new Date(a.voucher.date).getTime() - new Date(b.voucher.date).getTime()
    );

    // --- 5. FORMAT FOR UI ---
    let runningBalance = openingBalance;

    const formattedEntries = allEntries.map((entry) => {
      const v = entry.voucher;

      // Particulars Logic: Find other ledgers in the transaction
      // We look into the voucher's ledgerEntries list
      const siblingEntries = v.ledgerEntries || [];

      const particulars = siblingEntries
        .filter((e: any) => e.ledgerId !== activeLedgerId) // Exclude current ledger
        .map((e: any) => e.ledger?.name)
        .filter(Boolean)
        .join(", ");

      const amount = entry.amount || 0;
      // In DB: Debit is usually negative (-), Credit is positive (+)
      // For Cash Book:
      // - Debit (Receipt) = Incoming
      // - Credit (Payment) = Outgoing

      const isDebit = amount < 0;

      const debitAmount = isDebit ? Math.abs(amount) : 0;
      const creditAmount = !isDebit ? amount : 0;

      runningBalance += amount;

      return {
        id: v.id,
        date: v.date,
        voucherNo: v.voucherNo,
        type: entry.type,
        particulars: particulars || "As per details",
        debit: debitAmount,
        credit: creditAmount,
        balance: Math.abs(runningBalance),
        balanceType: runningBalance < 0 ? "Dr" : "Cr",
      };
    });

    return {
      cashLedgers,
      selectedLedgerId: activeLedgerId,
      openingBalance,
      closingBalance: runningBalance,
      entries: formattedEntries,
    };
  } catch (error: any) {
    console.error("Cash Book Error:", error);
    return { error: `Failed: ${error.message}` };
  }
}
