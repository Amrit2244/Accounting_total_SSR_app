"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(
  companyId: number,
  startDate: Date,
  endDate: Date
) {
  const allLedgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: true,
      salesEntries: {
        where: {
          salesVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
      purchaseEntries: {
        where: {
          purchaseVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
      paymentEntries: {
        where: {
          paymentVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
      receiptEntries: {
        where: {
          receiptVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
      contraEntries: {
        where: {
          contraVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
      journalEntries: {
        where: {
          journalVoucher: {
            status: "APPROVED",
            date: { gte: startDate, lte: endDate },
          },
        },
        select: { amount: true },
      },
    },
  });

  let totalCash = 0,
    totalBank = 0,
    totalDebtors = 0,
    totalCreditors = 0;

  allLedgers.forEach((l) => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
    const balance =
      l.openingBalance +
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);
    const n = l.name.toLowerCase(),
      g = l.group?.name.toLowerCase() || "";

    if (n.includes("cash")) totalCash += balance;
    else if (g.includes("bank") || n.includes("bank")) totalBank += balance;
    else if (g.includes("debtor")) totalDebtors += balance;
    else if (g.includes("creditor")) totalCreditors += Math.abs(balance);
  });

  const sales = await prisma.salesVoucher.aggregate({
    where: {
      companyId,
      status: "APPROVED",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { totalAmount: true },
  });
  const purchase = await prisma.purchaseVoucher.aggregate({
    where: {
      companyId,
      status: "APPROVED",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { totalAmount: true },
  });

  return {
    cards: { totalCash, totalBank, totalDebtors, totalCreditors },
    revenue: sales._sum.totalAmount || 0,
    expense: purchase._sum.totalAmount || 0,
    recents: [], // You can add recent voucher fetching logic here
  };
}
