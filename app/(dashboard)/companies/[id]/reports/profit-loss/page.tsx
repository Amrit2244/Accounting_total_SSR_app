import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import ProfitLossDrillDown from "@/components/reports/ProfitLossDrillDown";

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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  // --- 1. DATA FETCHING (Updated for New Schema) ---
  const [ledgers, stockItems] = await Promise.all([
    // A. Fetch Ledgers + 6 Transaction Types
    prisma.ledger.findMany({
      where: { companyId },
      include: {
        group: { select: { name: true, nature: true } },
        salesEntries: {
          where: { salesVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
        purchaseEntries: {
          where: { purchaseVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
        paymentEntries: {
          where: { paymentVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
        receiptEntries: {
          where: { receiptVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
        contraEntries: {
          where: { contraVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
        journalEntries: {
          where: { journalVoucher: { status: "APPROVED" } },
          select: { amount: true },
        },
      },
    }),
    // B. Fetch Stock Items + 3 Inventory Types
    prisma.stockItem.findMany({
      where: { companyId },
      include: {
        salesItems: { where: { salesVoucher: { status: "APPROVED" } } },
        purchaseItems: { where: { purchaseVoucher: { status: "APPROVED" } } },
        journalEntries: { where: { stockJournal: { status: "APPROVED" } } },
      },
    }),
  ]);

  // --- 2. STOCK VALUATION (Detailed) ---
  let openingStockTotal = 0;
  let closingStockTotal = 0;
  let openingStockDetails: { name: string; amount: number }[] = [];
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item) => {
    const opVal = item.openingValue || 0;

    if (opVal > 0) {
      openingStockTotal += opVal;
      openingStockDetails.push({ name: item.name, amount: opVal });
    }

    // Merge all entries into one list for calculation
    // Note: Sales quantity is negative in DB, Purchase is positive.
    const allEntries = [
      ...item.salesItems.map((e) => ({ qty: e.quantity, val: 0 })), // Sales Value irrelevant for Cost
      ...item.purchaseItems.map((e) => ({ qty: e.quantity, val: e.amount })),
      ...item.journalEntries.map((e) => ({ qty: e.quantity, val: e.amount })),
    ];

    let currentQty = item.openingQty || 0;
    let totalInwardQty = item.openingQty || 0;
    let totalInwardVal = opVal;

    allEntries.forEach((e) => {
      // 1. Update Current Stock
      currentQty += e.qty;

      // 2. WAC Calculation: Only Inwards (Positive Qty) affect the Rate
      if (e.qty > 0) {
        totalInwardQty += e.qty;
        totalInwardVal += e.val;
      }
    });

    // Avoid division by zero
    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    const closingVal = Math.max(0, currentQty * avgRate);

    if (closingVal > 0) {
      closingStockTotal += closingVal;
      closingStockDetails.push({ name: item.name, amount: closingVal });
    }
  });

  // --- 3. AGGREGATION HELPER ---
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
    // Sum from all 6 tables
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const netBalance = (l.openingBalance || 0) + txTotal;

    if (Math.abs(netBalance) < 0.01) return;
    if (!l.group) return;

    const absAmount = Math.abs(netBalance);
    const gName = l.group.name;
    const gLower = gName.toLowerCase();
    const nature = l.group.nature?.toUpperCase();

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

  // --- 5. BUILD TRADING ACCOUNT ---
  const tradingDr = Array.from(tradingDrMap.values());
  const tradingCr = Array.from(tradingCrMap.values());

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

  const sumTradingDr = tradingDr.reduce((s, i) => s + i.amount, 0);
  const sumTradingCr = tradingCr.reduce((s, i) => s + i.amount, 0);
  const grossDiff = sumTradingCr - sumTradingDr;
  const isGrossProfit = grossDiff >= 0;
  const tradingTotal = Math.max(sumTradingDr, sumTradingCr);

  // --- 6. BUILD P&L ACCOUNT ---
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

  const sumPLDr = plDr.reduce((s, i) => s + i.amount, 0);
  const sumPLCr = plCr.reduce((s, i) => s + i.amount, 0);
  const netDiff = sumPLCr - sumPLDr;
  const isNetProfit = netDiff >= 0;
  const plTotal = Math.max(sumPLDr, sumPLCr);

  // --- 7. RENDER COMPONENTS ---
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

      {/* REPORT BODY */}
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
          {/* DEBIT SIDE */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>
              {tradingDr.map((g) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {isGrossProfit && (
                <BalanceRow
                  label="To Gross Profit c/d"
                  amount={Math.abs(grossDiff)}
                  isProfitRow={false}
                />
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
              {plDr.map((g) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {isNetProfit && (
                <BalanceRow
                  label="To Net Profit"
                  amount={netDiff}
                  isProfitRow={true}
                />
              )}
            </div>
            <TotalRow amount={plTotal} />
          </div>

          {/* CREDIT SIDE */}
          <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1">
              <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                Trading Account
              </div>
              {tradingCr.map((g) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {!isGrossProfit && (
                <BalanceRow
                  label="By Gross Loss c/d"
                  amount={Math.abs(grossDiff)}
                  isProfitRow={false}
                />
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
              {plCr.map((g) => (
                <ProfitLossDrillDown key={g.groupName} item={g} />
              ))}
              {!isNetProfit && (
                <BalanceRow
                  label="By Net Loss"
                  amount={Math.abs(netDiff)}
                  isProfitRow={false}
                />
              )}
            </div>
            <TotalRow amount={plTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}
