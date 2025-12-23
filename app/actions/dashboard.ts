"use server";

import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  subMonths,
} from "date-fns";

// 1. Define Return Type
export type DashboardMetrics = {
  cards: {
    totalCash: number;
    totalBank: number;
    totalDebtors: number;
    totalCreditors: number;
  };
  revenue: number;
  expense: number;
  chart: { name: string; sales: number; purchases: number }[];
  recents: any[];
};

export async function getDashboardMetrics(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  try {
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

    // ✅ FIXED: Added (l: any) to satisfy TypeScript build
    allLedgers.forEach((l: any) => {
      const sum = (arr: any[]) =>
        arr.reduce((acc, curr) => acc + curr.amount, 0);

      const movement =
        sum(l.salesEntries) +
        sum(l.purchaseEntries) +
        sum(l.paymentEntries) +
        sum(l.receiptEntries) +
        sum(l.contraEntries) +
        sum(l.journalEntries);

      const balance = l.openingBalance + movement;
      const n = l.name.toLowerCase();
      const g = l.group?.name.toLowerCase() || "";

      if (n.includes("cash")) totalCash += balance;
      else if (g.includes("bank") || n.includes("bank")) totalBank += balance;
      else if (g.includes("debtor")) totalDebtors += balance;
      else if (g.includes("creditor")) totalCreditors += Math.abs(balance);
    });

    const salesAgg = await prisma.salesVoucher.aggregate({
      where: {
        companyId,
        status: "APPROVED",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    const purchaseAgg = await prisma.purchaseVoucher.aggregate({
      where: {
        companyId,
        status: "APPROVED",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });

    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const chart = await Promise.all(
      last6Months.map(async (month: Date) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);

        const [mSales, mPurchase] = await Promise.all([
          prisma.salesVoucher.aggregate({
            where: {
              companyId,
              date: { gte: mStart, lte: mEnd },
              status: "APPROVED",
            },
            _sum: { totalAmount: true },
          }),
          prisma.purchaseVoucher.aggregate({
            where: {
              companyId,
              date: { gte: mStart, lte: mEnd },
              status: "APPROVED",
            },
            _sum: { totalAmount: true },
          }),
        ]);

        return {
          name: format(month, "MMM"),
          sales: mSales._sum.totalAmount || 0,
          purchases: mPurchase._sum.totalAmount || 0,
        };
      })
    );

    const [recentSales, recentPurchases] = await Promise.all([
      prisma.salesVoucher.findMany({
        where: { companyId, status: "APPROVED" },
        take: 5,
        orderBy: { date: "desc" },
        include: { ledgerEntries: { include: { ledger: true } } },
      }),
      prisma.purchaseVoucher.findMany({
        where: { companyId, status: "APPROVED" },
        take: 5,
        orderBy: { date: "desc" },
        include: { ledgerEntries: { include: { ledger: true } } },
      }),
    ]);

    const recents = [
      ...recentSales.map((v: any) => ({
        ...v,
        type: "SALES",
        entries: v.ledgerEntries,
      })),
      ...recentPurchases.map((v: any) => ({
        ...v,
        type: "PURCHASE",
        entries: v.ledgerEntries,
      })),
    ]
      .sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5);

    return {
      cards: { totalCash, totalBank, totalDebtors, totalCreditors },
      revenue: salesAgg._sum.totalAmount || 0,
      expense: purchaseAgg._sum.totalAmount || 0,
      chart,
      recents,
    };
  } catch (error) {
    console.error("Metric Error", error);
    return {
      cards: { totalCash: 0, totalBank: 0, totalDebtors: 0, totalCreditors: 0 },
      revenue: 0,
      expense: 0,
      chart: [],
      recents: [],
    };
  }
}
