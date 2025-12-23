import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import ProfitLossDrillDown from "@/components/reports/ProfitLossDrillDown";
import BalanceSheetFilter from "@/components/reports/BalanceSheetFilter"; // Reuse the existing filter

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
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col font-sans">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <TrendingUp size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Trading & Profit Loss A/c
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              As on{" "}
              {asOfDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* NEW FILTER COMPONENT */}
          <BalanceSheetFilter />

          <PrintButton />
          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        <div className="flex border-b border-slate-200 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shrink-0">
          <div className="w-1/2 flex justify-between px-4 py-2 border-r border-slate-700">
            <span>Particulars</span>
            <span>Debit (₹)</span>
          </div>
          <div className="w-1/2 flex justify-between px-4 py-2">
            <span>Particulars</span>
            <span>Credit (₹)</span>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>
              {tradingDr.map((g: any) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {isGrossProfit && (
                <div className="flex justify-between py-2 px-3 my-1 border-y bg-rose-50 border-rose-100 text-rose-800">
                  <span className="text-[11px] font-black uppercase tracking-tight">
                    To Gross Profit c/d
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {fmt(Math.abs(grossDiff))}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-slate-100 px-3 py-1.5 flex justify-between text-[10px] font-black text-slate-500 border-t border-b border-slate-200">
              <span>Total Trading</span>
              <span className="font-mono">{fmt(tradingTotal)}</span>
            </div>
            <div className="flex-1 mt-2">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                P & L Account
              </div>
              {plDr.map((g: any) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {isNetProfit && (
                <div className="flex justify-between py-2 px-3 my-1 border-y bg-emerald-50 border-emerald-100 text-emerald-800">
                  <span className="text-[11px] font-black uppercase tracking-tight">
                    To Net Profit
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {fmt(netDiff)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between px-3 py-2 bg-slate-100 border-t border-slate-200 border-b-4 border-double border-b-slate-400 font-black text-xs text-slate-900 mt-auto">
              <span>Total</span>
              <span className="font-mono">{fmt(plTotal)}</span>
            </div>
          </div>
          <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>
              {tradingCr.map((g: any) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {!isGrossProfit && (
                <div className="flex justify-between py-2 px-3 my-1 border-y bg-rose-50 border-rose-100 text-rose-800">
                  <span className="text-[11px] font-black uppercase tracking-tight">
                    By Gross Loss c/d
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {fmt(Math.abs(grossDiff))}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-slate-100 px-3 py-1.5 flex justify-between text-[10px] font-black text-slate-500 border-t border-b border-slate-200">
              <span>Total Trading</span>
              <span className="font-mono">{fmt(tradingTotal)}</span>
            </div>
            <div className="flex-1 mt-2">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                P & L Account
              </div>
              {plCr.map((g: any) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {!isNetProfit && (
                <div className="flex justify-between py-2 px-3 my-1 border-y bg-rose-50 border-rose-100 text-rose-800">
                  <span className="text-[11px] font-black uppercase tracking-tight">
                    By Net Loss
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {fmt(Math.abs(netDiff))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between px-3 py-2 bg-slate-100 border-t border-slate-200 border-b-4 border-double border-b-slate-400 font-black text-xs text-slate-900 mt-auto">
              <span>Total</span>
              <span className="font-mono">{fmt(plTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
