import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Printer } from "lucide-react";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import ProfitLossDrillDown from "@/components/reports/ProfitLossDrillDown"; // Import the new component

const fmt = (v: number) =>
  Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Definition for the Grouped Data Structure
type GroupData = {
  groupName: string;
  amount: number;
  ledgers: { name: string; amount: number }[];
  isSystem?: boolean;
  prefix?: string; // "To" or "By"
};

export default async function ProfitLossPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  // --- 1. DATA FETCHING ---
  const [ledgers, stockItems] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      include: {
        group: { select: { name: true, nature: true } },
        entries: {
          where: { voucher: { status: "APPROVED" } },
          select: { amount: true },
        },
      },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      include: {
        inventoryEntries: { where: { voucher: { status: "APPROVED" } } },
      },
    }),
  ]);

  // --- 2. STOCK VALUATION (Detailed) ---
  let openingStockTotal = 0;
  let closingStockTotal = 0;
  // We keep details so we can expand "Closing Stock" to see "Wheat: 500", "Rice: 200"
  let openingStockDetails: { name: string; amount: number }[] = [];
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item) => {
    // Opening
    const opVal =
      item.openingValue || (item.openingQty || 0) * (item.openingRate || 0);
    if (opVal > 0) {
      openingStockTotal += opVal;
      openingStockDetails.push({ name: item.name, amount: opVal });
    }

    // Closing Logic
    let qty = item.openingQty || 0;
    let val = opVal;
    item.inventoryEntries.forEach((e) => {
      if (e.quantity > 0) {
        qty += e.quantity;
        val += e.amount;
      } else {
        qty -= Math.abs(e.quantity);
      }
    });

    // WAC Calculation
    const inwardRate =
      item.inventoryEntries.reduce(
        (s, e) => (e.quantity > 0 ? s + e.quantity : s),
        0
      ) + (item.openingQty || 0) || 1;
    const totalInwardVal =
      item.inventoryEntries.reduce(
        (s, e) => (e.quantity > 0 ? s + e.amount : s),
        0
      ) + opVal;
    const avgRate = totalInwardVal / inwardRate;
    const clVal = Math.max(0, qty * avgRate);

    if (clVal > 0) {
      closingStockTotal += clVal;
      closingStockDetails.push({ name: item.name, amount: clVal });
    }
  });

  // --- 3. AGGREGATION HELPER ---
  // Maps maintain order better than Objects in JS/TS
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
    if (!map.has(groupName)) {
      map.set(groupName, { groupName, amount: 0, ledgers: [], prefix });
    }
    const g = map.get(groupName)!;
    g.amount += amount;
    g.ledgers.push({ name: ledgerName, amount });
  };

  // --- 4. CLASSIFY LEDGERS ---
  ledgers.forEach((l) => {
    const netBalance =
      (l.openingBalance || 0) + l.entries.reduce((sum, e) => sum + e.amount, 0);
    if (Math.abs(netBalance) < 0.01) return;

    const absAmount = Math.abs(netBalance);
    const gName = l.group.name; // E.g., "Indirect Expenses"
    const gLower = gName.toLowerCase();
    const nature = l.group.nature?.toUpperCase();

    // Logic to route Ledger -> Correct Map
    if (gLower.includes("purchase") || gLower.includes("direct exp")) {
      addToMap(tradingDrMap, gName, l.name, absAmount, "To");
    } else if (gLower.includes("sales") || gLower.includes("direct inc")) {
      addToMap(tradingCrMap, gName, l.name, absAmount, "By");
    } else if (gLower.includes("indirect exp") || nature === "EXPENSE") {
      addToMap(plDrMap, gName, l.name, absAmount, "To");
    } else if (gLower.includes("indirect inc") || nature === "INCOME") {
      addToMap(plCrMap, gName, l.name, absAmount, "By");
    }
  });

  // --- 5. BUILD TRADING ACCOUNT LISTS ---
  const tradingDr = Array.from(tradingDrMap.values());
  const tradingCr = Array.from(tradingCrMap.values());

  // Inject Stocks
  if (openingStockTotal > 0) {
    tradingDr.unshift({
      groupName: "Opening Stock",
      amount: openingStockTotal,
      ledgers: openingStockDetails,
      isSystem: true,
      prefix: "To",
    });
  }
  if (closingStockTotal > 0) {
    tradingCr.push({
      groupName: "Closing Stock",
      amount: closingStockTotal,
      ledgers: closingStockDetails,
      isSystem: true,
      prefix: "By",
    });
  }

  // Trading Totals
  const sumTradingDr = tradingDr.reduce((s, i) => s + i.amount, 0);
  const sumTradingCr = tradingCr.reduce((s, i) => s + i.amount, 0);
  const grossDiff = sumTradingCr - sumTradingDr; // +ve = Profit
  const isGrossProfit = grossDiff >= 0;
  const tradingTotal = Math.max(sumTradingDr, sumTradingCr);

  // --- 6. BUILD P&L ACCOUNT LISTS ---
  const plDr = Array.from(plDrMap.values());
  const plCr = Array.from(plCrMap.values());

  // Transfer GP/GL
  const grossItem: GroupData = {
    groupName: isGrossProfit ? "Gross Profit b/d" : "Gross Loss b/d",
    amount: Math.abs(grossDiff),
    ledgers: [], // No drill down for system calc line
    isSystem: true,
    prefix: isGrossProfit ? "By" : "To",
  };

  if (isGrossProfit) plCr.unshift(grossItem);
  else plDr.unshift(grossItem);

  // P&L Totals
  const sumPLDr = plDr.reduce((s, i) => s + i.amount, 0);
  const sumPLCr = plCr.reduce((s, i) => s + i.amount, 0);
  const netDiff = sumPLCr - sumPLDr; // +ve = Profit
  const isNetProfit = netDiff >= 0;
  const plTotal = Math.max(sumPLDr, sumPLCr);

  // --- 7. RENDER HELPERS ---
  // Balancing Row Component
  const BalanceRow = ({
    label,
    amount,
    isProfitRow,
  }: {
    label: string;
    amount: number;
    isProfitRow?: boolean;
  }) => (
    <div
      className={`flex justify-between py-2 px-3 my-1 border-y ${
        isProfitRow
          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
          : "bg-rose-50 border-rose-100 text-rose-800"
      }`}
    >
      <span className="text-[11px] font-black uppercase tracking-tight">
        {label}
      </span>
      <span className="font-mono text-xs font-bold">{fmt(amount)}</span>
    </div>
  );

  const TotalRow = ({ amount }: { amount: number }) => (
    <div className="flex justify-between px-3 py-2 bg-slate-100 border-t border-slate-200 border-b-4 border-double border-b-slate-400 font-black text-xs text-slate-900 mt-auto">
      <span>Total</span>
      <span className="font-mono">{fmt(amount)}</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col font-sans">
      {/* HEADER */}
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
              Financial Year {new Date().getFullYear()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {/* MAIN REPORT CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        {/* TABLE HEADERS */}
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

        {/* SCROLLABLE CONTENT */}
        <div className="flex flex-1 min-h-0">
          {/* --- LEFT SIDE (DEBIT) --- */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            {/* TRADING ACCOUNT */}
            <div className="flex-1">
              {/* Sticky Sub-Header */}
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>

              {tradingDr.map((group) => (
                <ProfitLossDrillDown key={group.groupName} item={group} />
              ))}

              {/* Gross Profit c/d (Balancing Figure) */}
              {isGrossProfit && (
                <BalanceRow
                  label="To Gross Profit c/d"
                  amount={Math.abs(grossDiff)}
                  isProfitRow={false}
                />
              )}
            </div>

            {/* Trading Total Dr */}
            <div className="bg-slate-100 px-3 py-1.5 flex justify-between text-[10px] font-black text-slate-500 border-t border-b border-slate-200">
              <span>Total Trading</span>
              <span className="font-mono">{fmt(tradingTotal)}</span>
            </div>

            {/* P&L ACCOUNT */}
            <div className="flex-1 mt-2">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                P & L Account
              </div>

              {plDr.map((group) => (
                <ProfitLossDrillDown key={group.groupName} item={group} />
              ))}

              {/* Net Profit (Balancing Figure) */}
              {isNetProfit && (
                <BalanceRow
                  label="To Net Profit (Transferred to Capital)"
                  amount={netDiff}
                  isProfitRow={true}
                />
              )}
            </div>

            {/* P&L Total Dr */}
            <TotalRow amount={plTotal} />
          </div>

          {/* --- RIGHT SIDE (CREDIT) --- */}
          <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
            {/* TRADING ACCOUNT */}
            <div className="flex-1">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>

              {tradingCr.map((group) => (
                <ProfitLossDrillDown key={group.groupName} item={group} />
              ))}

              {/* Gross Loss c/d (Balancing Figure) */}
              {!isGrossProfit && (
                <BalanceRow
                  label="By Gross Loss c/d"
                  amount={Math.abs(grossDiff)}
                  isProfitRow={false}
                />
              )}
            </div>

            {/* Trading Total Cr */}
            <div className="bg-slate-100 px-3 py-1.5 flex justify-between text-[10px] font-black text-slate-500 border-t border-b border-slate-200">
              <span>Total Trading</span>
              <span className="font-mono">{fmt(tradingTotal)}</span>
            </div>

            {/* P&L ACCOUNT */}
            <div className="flex-1 mt-2">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                P & L Account
              </div>

              {plCr.map((group) => (
                <ProfitLossDrillDown key={group.groupName} item={group} />
              ))}

              {/* Net Loss (Balancing Figure) */}
              {!isNetProfit && (
                <BalanceRow
                  label="By Net Loss (Transferred to Capital)"
                  amount={Math.abs(netDiff)}
                  isProfitRow={false}
                />
              )}
            </div>

            {/* P&L Total Cr */}
            <TotalRow amount={plTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}
