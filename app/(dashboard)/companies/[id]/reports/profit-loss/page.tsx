import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, ChevronRight } from "lucide-react";
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
  prefix?: string;
};

export default async function ProfitLossPage({
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

  // Filter applied to all queries
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

  let openingStockTotal = 0;
  let closingStockTotal = 0;
  let openingStockDetails: { name: string; amount: number }[] = [];
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item: any) => {
    const opVal = item.openingValue || 0;
    if (opVal > 0) {
      openingStockTotal += opVal;
      openingStockDetails.push({ name: item.name, amount: opVal });
    }

    const allEntries = [
      ...item.salesItems.map((e: any) => ({ qty: e.quantity, val: 0 })),
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
        totalInwardQty += e.qty;
        totalInwardVal += e.val;
      }
    });

    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    const closingVal = Math.max(0, currentQty * avgRate);

    if (closingVal > 0) {
      closingStockTotal += closingVal;
      closingStockDetails.push({ name: item.name, amount: closingVal });
    }
  });

  const tradingDrMap = new Map<string, GroupData>();
  const tradingCrMap = new Map<string, GroupData>();
  const plDrMap = new Map<string, GroupData>();
  const plCrMap = new Map<string, GroupData>();

  const addToMap = (
    map: Map<string, GroupData>,
    groupName: string,
    ledgerName: string,
    amount: number,
    prefix: string
  ) => {
    if (!map.has(groupName))
      map.set(groupName, { groupName, amount: 0, ledgers: [], prefix });
    const g = map.get(groupName)!;
    g.amount += amount;
    g.ledgers.push({ name: ledgerName, amount });
  };

  ledgers.forEach((l: any) => {
    const sum = (arr: any[]) =>
      arr.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const netBalance = (l.openingBalance || 0) + txTotal;

    if (Math.abs(netBalance) < 0.01 || !l.group) return;

    const absAmount = Math.abs(netBalance);
    const gName = l.group.name;
    const gLower = gName.toLowerCase();
    const nature = l.group.nature?.toUpperCase();

    if (gLower.includes("purchase") || gLower.includes("direct exp"))
      addToMap(tradingDrMap, gName, l.name, absAmount, "To");
    else if (gLower.includes("sales") || gLower.includes("direct inc"))
      addToMap(tradingCrMap, gName, l.name, absAmount, "By");
    else if (gLower.includes("indirect exp") || nature === "EXPENSE")
      addToMap(plDrMap, gName, l.name, absAmount, "To");
    else if (gLower.includes("indirect inc") || nature === "INCOME")
      addToMap(plCrMap, gName, l.name, absAmount, "By");
  });

  const tradingDr = Array.from(tradingDrMap.values());
  const tradingCr = Array.from(tradingCrMap.values());

  if (openingStockTotal > 0)
    tradingDr.unshift({
      groupName: "Opening Stock",
      amount: openingStockTotal,
      ledgers: openingStockDetails,
      isSystem: true,
      prefix: "To",
    });

  if (closingStockTotal > 0)
    tradingCr.push({
      groupName: "Closing Stock",
      amount: closingStockTotal,
      ledgers: closingStockDetails,
      isSystem: true,
      prefix: "By",
    });

  const sumTradingDr = tradingDr.reduce((s: number, i: any) => s + i.amount, 0);
  const sumTradingCr = tradingCr.reduce((s: number, i: any) => s + i.amount, 0);
  const grossDiff = sumTradingCr - sumTradingDr;
  const isGrossProfit = grossDiff >= 0;
  const tradingTotal = Math.max(sumTradingDr, sumTradingCr);

  const plDr = Array.from(plDrMap.values());
  const plCr = Array.from(plCrMap.values());

  const grossItem: GroupData = {
    groupName: isGrossProfit ? "Gross Profit b/d" : "Gross Loss b/d",
    amount: Math.abs(grossDiff),
    ledgers: [],
    isSystem: true,
    prefix: isGrossProfit ? "By" : "To",
  };

  if (isGrossProfit) plCr.unshift(grossItem);
  else plDr.unshift(grossItem);

  const sumPLDr = plDr.reduce((s: number, i: any) => s + i.amount, 0);
  const sumPLCr = plCr.reduce((s: number, i: any) => s + i.amount, 0);
  const netDiff = sumPLCr - sumPLDr;
  const isNetProfit = netDiff >= 0;
  const plTotal = Math.max(sumPLDr, sumPLCr);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 flex flex-col">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 flex flex-col h-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20 print:hidden">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <Link
                href={`/companies/${companyId}/reports`}
                className="hover:text-indigo-600 transition-colors"
              >
                Reports
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Profit & Loss</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <TrendingUp className="text-indigo-600" size={32} />
              Profit & Loss A/c
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Statement of financial performance as of{" "}
              {asOfDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          </div>

          <div className="flex items-center gap-3">
            <BalanceSheetFilter />

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <PrintButton />

            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Reports"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* REPORT CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[600px] print:shadow-none print:border-none">
          {/* Main Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-1/2 px-6 py-3 border-r border-slate-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-600">
              <span>Particulars</span>
              <span>Debit (₹)</span>
            </div>
            <div className="w-1/2 px-6 py-3 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-600">
              <span>Particulars</span>
              <span>Credit (₹)</span>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex flex-1 min-h-0">
            {/* --- DEBIT SIDE (Left) --- */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-50/10">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Trading Account Dr */}
                <div className="px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                  Trading Account
                </div>
                <div className="p-2 space-y-1">
                  {tradingDr.map((g: any) => (
                    <ProfitLossDrillDown key={g.groupName} item={g} />
                  ))}
                  {isGrossProfit && (
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                      <span className="text-xs font-bold">
                        To Gross Profit c/d
                      </span>
                      <span className="font-mono text-xs font-bold">
                        {fmt(Math.abs(grossDiff))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Trading Total Dr */}
                <div className="flex justify-between px-6 py-2 bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-700">
                  <span>Total Trading</span>
                  <span className="font-mono">{fmt(tradingTotal)}</span>
                </div>

                {/* P&L Account Dr */}
                <div className="px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 mt-4">
                  Profit & Loss Account
                </div>
                <div className="p-2 space-y-1">
                  {plDr.map((g: any) => (
                    <ProfitLossDrillDown key={g.groupName} item={g} />
                  ))}
                  {isNetProfit && (
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                      <span className="text-xs font-bold">To Net Profit</span>
                      <span className="font-mono text-xs font-bold">
                        {fmt(netDiff)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total Dr */}
              <div className="flex justify-between px-6 py-4 bg-slate-100 border-t border-slate-200 border-b-4 border-b-slate-300 text-sm font-black text-slate-900 mt-auto">
                <span>TOTAL</span>
                <span className="font-mono">{fmt(plTotal)}</span>
              </div>
            </div>

            {/* --- CREDIT SIDE (Right) --- */}
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Trading Account Cr */}
                <div className="px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                  Trading Account
                </div>
                <div className="p-2 space-y-1">
                  {tradingCr.map((g: any) => (
                    <ProfitLossDrillDown key={g.groupName} item={g} />
                  ))}
                  {!isGrossProfit && (
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                      <span className="text-xs font-bold">
                        By Gross Loss c/d
                      </span>
                      <span className="font-mono text-xs font-bold">
                        {fmt(Math.abs(grossDiff))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Trading Total Cr */}
                <div className="flex justify-between px-6 py-2 bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-700">
                  <span>Total Trading</span>
                  <span className="font-mono">{fmt(tradingTotal)}</span>
                </div>

                {/* P&L Account Cr */}
                <div className="px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 mt-4">
                  Profit & Loss Account
                </div>
                <div className="p-2 space-y-1">
                  {plCr.map((g: any) => (
                    <ProfitLossDrillDown key={g.groupName} item={g} />
                  ))}
                  {!isNetProfit && (
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                      <span className="text-xs font-bold">By Net Loss</span>
                      <span className="font-mono text-xs font-bold">
                        {fmt(Math.abs(netDiff))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total Cr */}
              <div className="flex justify-between px-6 py-4 bg-slate-100 border-t border-slate-200 border-b-4 border-b-slate-300 text-sm font-black text-slate-900 mt-auto">
                <span>TOTAL</span>
                <span className="font-mono">{fmt(plTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
