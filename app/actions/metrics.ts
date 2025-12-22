"use server";

import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  subMonths,
} from "date-fns";

// 1. Define the return type explicitly to prevent build errors
export type DashboardMetrics = {
  cards: {
    totalCash: number;
    totalBank: number;
    totalDebtors: number;
    totalCreditors: number;
  };
  revenue: number;
  expense: number;
  chart: { name: string; sales: number; purchases: number }[]; // ✅ Explicitly defined
  recents: any[];
};

export async function getDashboardMetrics(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  try {
    // 2. Fetch Totals for Revenue (Sales) and Expenses (Purchase + Payments)
    const [salesSum, purchaseSum, paymentSum] = await Promise.all([
      prisma.salesVoucher.aggregate({
        where: {
          companyId,
          date: { gte: startDate, lte: endDate },
          status: "APPROVED",
        },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseVoucher.aggregate({
        where: {
          companyId,
          date: { gte: startDate, lte: endDate },
          status: "APPROVED",
        },
        _sum: { totalAmount: true },
      }),
      prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          date: { gte: startDate, lte: endDate },
          status: "APPROVED",
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const revenue = salesSum._sum.totalAmount || 0;
    const totalExpenses =
      (purchaseSum._sum.totalAmount || 0) + (paymentSum._sum.totalAmount || 0);

    // 3. Generate Chart Data (Last 6 Months)
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const chart = await Promise.all(
      last6Months.map(async (month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const [mSales, mPurchase] = await Promise.all([
          prisma.salesVoucher.aggregate({
            where: {
              companyId,
              date: { gte: monthStart, lte: monthEnd },
              status: "APPROVED",
            },
            _sum: { totalAmount: true },
          }),
          prisma.purchaseVoucher.aggregate({
            where: {
              companyId,
              date: { gte: monthStart, lte: monthEnd },
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

    // 4. Return Object (Must match the type definition above)
    return {
      cards: {
        totalCash: 0,
        totalBank: 0,
        totalDebtors: 0,
        totalCreditors: 0,
      },
      revenue,
      expense: totalExpenses,
      chart: chart, // ✅ Returns the calculated chart data
      recents: [],
    };
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    // Return empty fallback that satisfies the type
    return {
      cards: { totalCash: 0, totalBank: 0, totalDebtors: 0, totalCreditors: 0 },
      revenue: 0,
      expense: 0,
      chart: [], // ✅ Always return an array, even on error
      recents: [],
    };
  }
}
