import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PieChart, ChevronRight, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import ProfitLossDrillDown from "@/components/reports/ProfitLossDrillDown";
import BalanceSheetFilter from "@/components/reports/BalanceSheetFilter";

const fmt = (v: number) =>
  Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type GroupData = {
  groupName: string;
  amount: number;
  ledgers: { name: string; amount: number }[];
  isSystem?: boolean;
};

export default async function BalanceSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  // --- 1. DATE LOGIC ---
  const todayStr = new Date().toISOString().split("T")[0];
  const asOf = sp.date || todayStr;
  const asOfDate = new Date(asOf);
  asOfDate.setHours(23, 59, 59, 999);

  /** * ✅ AUTO-VERIFY COMPATIBILITY:
   * We filter only APPROVED status. This includes:
   * 1. Standard Maker-Checker approved vouchers.
   * 2. Admin Auto-Verified vouchers (Skip-Checker logic).
   */
  const voucherFilter = {
    status: "APPROVED",
    date: { lte: asOfDate },
  };

  // --- 2. DATA FETCHING ---
  const [ledgers, stockItems] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      include: {
        group: { select: { name: true, nature: true } },
        salesEntries: {
          where: { salesVoucher: voucherFilter },
          select: { amount: true },
        },
        purchaseEntries: {
          where: { purchaseVoucher: voucherFilter },
          select: { amount: true },
        },
        paymentEntries: {
          where: { paymentVoucher: voucherFilter },
          select: { amount: true },
        },
        receiptEntries: {
          where: { receiptVoucher: voucherFilter },
          select: { amount: true },
        },
        contraEntries: {
          where: { contraVoucher: voucherFilter },
          select: { amount: true },
        },
        journalEntries: {
          where: { journalVoucher: voucherFilter },
          select: { amount: true },
        },
      },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      include: {
        salesItems: { where: { salesVoucher: voucherFilter } },
        purchaseItems: { where: { purchaseVoucher: voucherFilter } },
        journalEntries: { where: { stockJournal: voucherFilter } },
      },
    }),
  ]);

  // --- 3. CALCULATE P&L FOR BALANCE SHEET ---
  let openingStock = 0;
  let closingStock = 0;

  stockItems.forEach((item: any) => {
    openingStock += Math.abs(item.openingValue || 0);
    const allEntries = [
      ...item.salesItems.map((e: any) => ({ qty: e.quantity, val: e.amount })),
      ...item.purchaseItems.map((e: any) => ({
        qty: e.quantity,
        val: e.amount,
      })),
      ...item.journalEntries.map((e: any) => ({
        qty: e.quantity,
        val: e.amount,
      })),
    ];

    let currentQty = item.openingQty || 0;
    let totalInwardQty = item.openingQty || 0;
    let totalInwardVal = Math.abs(item.openingValue || 0);

    allEntries.forEach((e: any) => {
      currentQty += e.qty;
      if (e.qty > 0) {
        totalInwardQty += e.qty;
        totalInwardVal += Math.abs(e.val);
      }
    });

    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    closingStock += Math.max(0, currentQty * avgRate);
  });

  let totalExpense = openingStock;
  let totalIncome = closingStock;

  ledgers.forEach((l: any) => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
    const net =
      (l.openingBalance || 0) +
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    if (Math.abs(net) < 0.01 || !l.group) return;

    const nature = l.group.nature?.toUpperCase();
    if (nature === "EXPENSE") totalExpense += Math.abs(net);
    else if (nature === "INCOME") totalIncome += net;
  });

  const netResult = totalIncome - totalExpense;
  const isProfit = netResult >= 0;

  // --- 4. CLASSIFY ASSETS & LIABILITIES ---
  const liabMap = new Map<string, GroupData>();
  const assetMap = new Map<string, GroupData>();

  const addToMap = (
    map: Map<string, GroupData>,
    groupName: string,
    ledgerName: string,
    amount: number
  ) => {
    if (!map.has(groupName))
      map.set(groupName, { groupName, amount: 0, ledgers: [] });
    const g = map.get(groupName)!;
    g.amount += amount;
    g.ledgers.push({ name: ledgerName, amount });
  };

  ledgers.forEach((l: any) => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
    const net =
      (l.openingBalance || 0) +
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    if (Math.abs(net) < 0.01 || !l.group) return;
    const nature = l.group.nature?.toUpperCase();
    if (nature === "EXPENSE" || nature === "INCOME") return;

    // Dr < 0 is Asset, Cr > 0 is Liability
    if (net < 0) addToMap(assetMap, l.group.name, l.name, Math.abs(net));
    else addToMap(liabMap, l.group.name, l.name, net);
  });

  if (isProfit)
    addToMap(liabMap, "Reserves & Surplus", "Net Profit (P&L)", netResult);
  else addToMap(assetMap, "P&L Account", "Net Loss", Math.abs(netResult));

  if (closingStock > 0)
    addToMap(assetMap, "Current Assets", "Closing Stock", closingStock);

  const liabilities = Array.from(liabMap.values());
  const assets = Array.from(assetMap.values());
  const grandTotal = Math.max(
    liabilities.reduce((s, i) => s + i.amount, 0),
    assets.reduce((s, i) => s + i.amount, 0)
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col px-4 md:px-8 py-6">
      <div className="max-w-[1920px] mx-auto w-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Balance Sheet</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <PieChart className="text-indigo-600" size={32} />
              Balance Sheet
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-500 text-sm font-medium">
                As of {new Date(asOf).toLocaleDateString("en-IN")}
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                <ShieldCheck size={12} />
                <span className="text-[10px] font-black uppercase tracking-tight">
                  Verified Statement
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BalanceSheetFilter />
            <PrintButton />
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* BALANCE SHEET TABLE */}
        <div className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col print:border-none print:shadow-none">
          <div className="flex border-b-2 border-slate-900 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
            <div className="w-1/2 px-6 py-4 border-r border-slate-700 flex justify-between items-center">
              <span>Liabilities & Equity</span>
              <span className="text-[10px] opacity-60 font-medium">
                Amount (₹)
              </span>
            </div>
            <div className="w-1/2 px-6 py-4 flex justify-between items-center">
              <span>Assets</span>
              <span className="text-[10px] opacity-60 font-medium">
                Amount (₹)
              </span>
            </div>
          </div>

          <div className="flex flex-1 divide-x-2 divide-slate-900">
            {/* Liabilities Side */}
            <div className="w-1/2 flex flex-col bg-slate-50/20">
              <div className="flex-1 p-4 space-y-1">
                {liabilities.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))}
              </div>
              <div className="mt-auto px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <span className="font-black text-xs uppercase">
                  Total Liabilities
                </span>
                <span className="font-mono font-bold text-lg">
                  ₹{fmt(grandTotal)}
                </span>
              </div>
            </div>

            {/* Assets Side */}
            <div className="w-1/2 flex flex-col bg-white">
              <div className="flex-1 p-4 space-y-1">
                {assets.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))}
              </div>
              <div className="mt-auto px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <span className="font-black text-xs uppercase">
                  Total Assets
                </span>
                <span className="font-mono font-bold text-lg">
                  ₹{fmt(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
