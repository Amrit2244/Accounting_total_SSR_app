"use server";

import { prisma } from "@/lib/prisma";

// ✅ 1. We receive these 3 values from the Page
export async function getDashboardMetrics(
  companyId: number,
  startDate: Date,
  endDate: Date
) {
  // ❌ DELETE the old "const today...", "const startDate..." lines from here.
  // They are already provided by the function arguments above.

  // 2. FETCH CARD METRICS (Cash, Bank, Debtors, Creditors)
  const allLedgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: true,
      entries: {
        where: {
          voucher: {
            status: "APPROVED",
            // Use the passed startDate/endDate for filtering transactions
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    },
  });

  let totalCash = 0;
  let totalBank = 0;
  let totalDebtors = 0;
  let totalCreditors = 0;

  allLedgers.forEach((l) => {
    const dr = l.entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const cr = l.entries
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const balance = l.openingBalance + (dr - cr);
    const groupName = l.group?.name.toLowerCase() || "";

    if (groupName.includes("cash")) totalCash += balance;
    else if (groupName.includes("bank")) totalBank += balance;
    else if (groupName.includes("debtor")) totalDebtors += balance;
    else if (groupName.includes("creditor"))
      totalCreditors += Math.abs(balance);
  });

  // 3. FETCH CHART DATA
  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "APPROVED",
      type: { in: ["SALES", "PURCHASE"] },
      date: { gte: startDate, lte: endDate }, // Use passed dates
    },
    include: { entries: true },
  });

  // Calculate Month Index based on StartDate (usually April)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startDate);
    d.setMonth(startDate.getMonth() + i);
    return {
      name: d.toLocaleString("default", { month: "short" }),
      sales: 0,
      purchase: 0,
    };
  });

  vouchers.forEach((v) => {
    let monthIndex = (v.date.getMonth() - startDate.getMonth() + 12) % 12;

    const amount = v.entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    if (v.type === "SALES") monthlyData[monthIndex].sales += amount;
    if (v.type === "PURCHASE") monthlyData[monthIndex].purchase += amount;
  });

  // 4. FETCH RECENT TRANSACTIONS (Filtered by FY)
  const recentVouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "desc" },
    take: 5,
    include: { entries: { include: { ledger: true } } },
  });

  return {
    cards: { totalCash, totalBank, totalDebtors, totalCreditors },
    chart: monthlyData,
    recents: recentVouchers,
  };
}
