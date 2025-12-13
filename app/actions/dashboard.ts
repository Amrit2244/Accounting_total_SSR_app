"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(companyId: number) {
  // 1. Get Date Range (Current Financial Year: April to March)
  const today = new Date();
  const currentYear =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const startDate = new Date(`${currentYear}-04-01`);
  const endDate = new Date(`${currentYear + 1}-03-31`);

  // 2. FETCH CARD METRICS (Cash, Bank, Debtors, Creditors)
  // We fetch ledgers by group name keywords to sum their balances
  const allLedgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: true,
      entries: { where: { voucher: { status: "APPROVED" } } }, // Only confirmed transactions
    },
  });

  let totalCash = 0;
  let totalBank = 0;
  let totalDebtors = 0; // Money people owe us
  let totalCreditors = 0; // Money we owe people

  allLedgers.forEach((l) => {
    // Calculate Net Balance
    const dr = l.entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const cr = l.entries
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const balance = l.openingBalance + (dr - cr);
    const groupName = l.group.name.toLowerCase();

    if (groupName.includes("cash")) totalCash += balance;
    else if (groupName.includes("bank")) totalBank += balance;
    else if (groupName.includes("debtor")) totalDebtors += balance;
    else if (groupName.includes("creditor"))
      totalCreditors += Math.abs(balance); // Usually Credit balance
  });

  // 3. FETCH CHART DATA (Sales vs Purchase Trend)
  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "APPROVED",
      type: { in: ["SALES", "PURCHASE"] },
      date: { gte: startDate, lte: endDate },
    },
    include: { entries: true },
  });

  // Group by Month
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, 3 + i, 1); // Start from April
    return {
      name: d.toLocaleString("default", { month: "short" }),
      sales: 0,
      purchase: 0,
    };
  });

  vouchers.forEach((v) => {
    // Find month index relative to Financial Year (April = 0)
    let monthIndex = v.date.getMonth() - 3;
    if (monthIndex < 0) monthIndex += 12; // Handle Jan-Mar

    // Calculate Voucher Total Amount (Sum of positive entries usually works for header)
    // Simplification: We sum all positive amounts in the voucher entries (or inventory entries if available)
    const amount = v.entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    if (v.type === "SALES") monthlyData[monthIndex].sales += amount;
    if (v.type === "PURCHASE") monthlyData[monthIndex].purchase += amount;
  });

  // 4. FETCH RECENT TRANSACTIONS
  const recentVouchers = await prisma.voucher.findMany({
    where: { companyId },
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
