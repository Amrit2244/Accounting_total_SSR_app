import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PieChart, ChevronRight } from "lucide-react";
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

  // --- 3. CALCULATE PROFIT & LOSS (Trading/PL logic) ---
  let openingStock = 0;
  let closingStock = 0;
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item: any) => {
    const opVal = Math.abs(item.openingValue || 0);
    openingStock += opVal;

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
    let totalInwardVal = opVal;

    allEntries.forEach((e: any) => {
      currentQty += e.qty;
      if (e.qty > 0) {
        // Purchase/Inward
        totalInwardQty += e.qty;
        totalInwardVal += Math.abs(e.val);
      }
    });

    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    const clVal = Math.max(0, currentQty * avgRate);

    if (clVal > 0) {
      closingStock += clVal;
      closingStockDetails.push({ name: item.name, amount: clVal });
    }
  });

  let totalExpense = openingStock;
  let totalIncome = closingStock;

  ledgers.forEach((l: any) => {
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const net = (l.openingBalance || 0) + txTotal;
    if (Math.abs(net) < 0.01 || !l.group) return;

    const gName = l.group.name.toLowerCase();
    const nature = l.group.nature?.toUpperCase();

    // Check if Ledger belongs to Trading/PL
    const isTradingPL =
      nature === "EXPENSE" ||
      nature === "INCOME" ||
      gName.includes("purchase") ||
      gName.includes("direct exp") ||
      gName.includes("indirect exp") ||
      gName.includes("sales") ||
      gName.includes("direct inc") ||
      gName.includes("indirect inc");

    if (isTradingPL) {
      if (net < 0) totalExpense += Math.abs(net); // Debit is Expense
      else totalIncome += net; // Credit is Income
    }
  });

  const netResult = totalIncome - totalExpense;
  const isProfit = netResult >= 0;

  // --- 4. CLASSIFY ASSETS & LIABILITIES (Balance Sheet logic) ---
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
    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const net = (l.openingBalance || 0) + txTotal;
    if (Math.abs(net) < 0.01 || !l.group) return;

    const nature = l.group.nature?.toUpperCase();
    const gName = l.group.name.toLowerCase();

    // Skip Trading/PL ledgers as they are already summarized in netResult
    const isTradingPL =
      nature === "EXPENSE" ||
      nature === "INCOME" ||
      gName.includes("purchase") ||
      gName.includes("sales") ||
      gName.includes("direct") ||
      gName.includes("indirect");
    if (isTradingPL) return;

    /**
     * ✅ LOGIC FIX:
     * Negative (< 0) -> Debit (Asset)
     * Positive (> 0) -> Credit (Liability)
     */
    if (net < 0) {
      addToMap(assetMap, l.group.name, l.name, Math.abs(net));
    } else {
      addToMap(liabMap, l.group.name, l.name, net);
    }
  });

  // Inject Net Profit/Loss
  if (isProfit) {
    addToMap(
      liabMap,
      "Reserves & Surplus",
      "Profit & Loss A/c (Net Profit)",
      netResult
    );
  } else {
    addToMap(assetMap, "Profit & Loss A/c", "Net Loss", Math.abs(netResult));
  }

  // Inject Closing Stock
  if (closingStock > 0) {
    addToMap(assetMap, "Current Assets", "Closing Stock", closingStock);
  }

  const liabilities = Array.from(liabMap.values());
  const assets = Array.from(assetMap.values());
  const totalLiab = liabilities.reduce((s, i) => s + i.amount, 0);
  const totalAsset = assets.reduce((s, i) => s + i.amount, 0);
  const grandTotal = Math.max(totalLiab, totalAsset);
  const diff = totalLiab - totalAsset;
  const isBalanced = Math.abs(diff) < 0.1;

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
            <p className="text-slate-500 text-sm">
              Statement of Financial Position as of{" "}
              {new Date(asOf).toLocaleDateString("en-IN")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BalanceSheetFilter />
            <PrintButton />
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* BALANCE SHEET TABLE */}
        <div className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col print:border-none print:shadow-none">
          <div className="flex border-b-2 border-slate-900 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
            <div className="w-1/2 px-6 py-4 border-r border-slate-700 flex justify-between">
              <span>Liabilities</span>
              <span>Amount (₹)</span>
            </div>
            <div className="w-1/2 px-6 py-4 flex justify-between">
              <span>Assets</span>
              <span>Amount (₹)</span>
            </div>
          </div>

          <div className="flex flex-1 divide-x-2 divide-slate-900">
            {/* Liabilities Side */}
            <div className="w-1/2 flex flex-col bg-slate-50/30">
              <div className="flex-1 p-4 space-y-1">
                {liabilities.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))}
              </div>
              {!isBalanced && diff < 0 && (
                <div className="px-6 py-3 bg-rose-50 text-rose-700 text-xs font-bold border-t border-rose-100 flex justify-between items-center italic">
                  <span>Difference in Assets/Liabilities</span>
                  <span>{fmt(Math.abs(diff))}</span>
                </div>
              )}
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
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 p-4 space-y-1">
                {assets.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))}
              </div>
              {!isBalanced && diff > 0 && (
                <div className="px-6 py-3 bg-rose-50 text-rose-700 text-xs font-bold border-t border-rose-100 flex justify-between items-center italic">
                  <span>Difference in Assets/Liabilities</span>
                  <span>{fmt(Math.abs(diff))}</span>
                </div>
              )}
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
