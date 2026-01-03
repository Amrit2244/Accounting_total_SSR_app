import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, ChevronRight, ShieldCheck } from "lucide-react";
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

  const asOf = sp.date || new Date().toISOString().split("T")[0];
  const asOfDate = new Date(asOf);
  asOfDate.setHours(23, 59, 59, 999);

  /** * ✅ AUTO-VERIFY COMPATIBILITY:
   * Filter includes standard approved AND admin auto-approved vouchers.
   */
  const voucherFilter = { status: "APPROVED", date: { lte: asOfDate } };

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

  // --- 1. STOCK CALCULATIONS ---
  let openingStockTotal = 0;
  let closingStockTotal = 0;
  let openingStockDetails: { name: string; amount: number }[] = [];
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item: any) => {
    const opVal = Math.abs(item.openingValue || 0);
    openingStockTotal += opVal;
    openingStockDetails.push({ name: item.name, amount: opVal });

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
        totalInwardQty += e.qty;
        totalInwardVal += Math.abs(e.val);
      }
    });

    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    const closingVal = Math.max(0, currentQty * avgRate);

    if (closingVal > 0) {
      closingStockTotal += closingVal;
      closingStockDetails.push({ name: item.name, amount: closingVal });
    }
  });

  // --- 2. LEDGER CATEGORIZATION ---
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
    g.amount += Math.abs(amount);
    g.ledgers.push({ name: ledgerName, amount: Math.abs(amount) });
  };

  ledgers.forEach((l: any) => {
    const sum = (arr: any[]) =>
      arr.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const netBalance =
      (l.openingBalance || 0) +
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    if (Math.abs(netBalance) < 0.01 || !l.group) return;

    const gLower = l.group.name.toLowerCase();
    const nature = l.group.nature?.toUpperCase();

    // Logic: Trading Account (Direct) vs Profit & Loss (Indirect)
    const isDirect =
      gLower.includes("purchase") ||
      gLower.includes("direct exp") ||
      gLower.includes("sales") ||
      gLower.includes("direct inc");

    if (isDirect) {
      if (netBalance < 0)
        addToMap(tradingDrMap, l.group.name, l.name, netBalance, "To");
      else addToMap(tradingCrMap, l.group.name, l.name, netBalance, "By");
    } else if (nature === "EXPENSE") {
      addToMap(plDrMap, l.group.name, l.name, netBalance, "To");
    } else if (nature === "INCOME") {
      addToMap(plCrMap, l.group.name, l.name, netBalance, "By");
    }
  });

  // --- 3. TOTALS & BALANCING ---
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

  const grossDiff =
    tradingCr.reduce((s, i) => s + i.amount, 0) -
    tradingDr.reduce((s, i) => s + i.amount, 0);
  const isGrossProfit = grossDiff >= 0;

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

  const netDiff =
    plCr.reduce((s, i) => s + i.amount, 0) -
    plDr.reduce((s, i) => s + i.amount, 0);
  const isNetProfit = netDiff >= 0;
  const plTotal = Math.max(
    plCr.reduce((s, i) => s + i.amount, 0),
    plDr.reduce((s, i) => s + i.amount, 0)
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
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
              <span className="text-slate-900">Profit & Loss</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <TrendingUp className="text-indigo-600" size={32} />
              Profit & Loss A/c
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-500 font-medium text-xs uppercase">
                Period ending {asOfDate.toLocaleDateString("en-IN")}
              </p>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                <ShieldCheck size={12} />
                <span className="text-[10px] font-black uppercase">
                  Verified Data
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BalanceSheetFilter />
            <PrintButton />
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white border-2 border-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[600px] print:shadow-none print:border-none">
          <div className="flex border-b-2 border-slate-900 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
            <div className="w-1/2 px-6 py-4 border-r border-slate-700 flex justify-between">
              <span>Expenses (Debit)</span>
              <span>Amount (₹)</span>
            </div>
            <div className="w-1/2 px-6 py-4 flex justify-between">
              <span>Incomes (Credit)</span>
              <span>Amount (₹)</span>
            </div>
          </div>

          <div className="flex flex-1 divide-x-2 divide-slate-900">
            {/* DEBIT SIDE */}
            <div className="w-1/2 flex flex-col bg-slate-50/20">
              <div className="flex-1 p-4 space-y-6">
                <section>
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 border-b border-indigo-100 pb-1">
                    Trading Account
                  </h4>
                  <div className="space-y-1">
                    {tradingDr.map((g) => (
                      <ProfitLossDrillDown key={g.groupName} item={g} />
                    ))}
                    {isGrossProfit && (
                      <div className="flex justify-between py-2 px-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-800 font-bold text-xs uppercase italic">
                        <span>To Gross Profit c/d</span>
                        <span className="font-mono">{fmt(grossDiff)}</span>
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 border-b border-indigo-100 pb-1">
                    Profit & Loss Account
                  </h4>
                  <div className="space-y-1">
                    {plDr.map((g) => (
                      <ProfitLossDrillDown key={g.groupName} item={g} />
                    ))}
                    {isNetProfit && (
                      <div className="flex justify-between py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-xs uppercase italic">
                        <span>To Net Profit</span>
                        <span className="font-mono">{fmt(netDiff)}</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <div className="mt-auto flex justify-between px-6 py-4 bg-slate-900 text-white text-sm font-black border-t border-slate-700">
                <span>TOTAL DEBIT</span>
                <span className="font-mono">₹{fmt(plTotal)}</span>
              </div>
            </div>

            {/* CREDIT SIDE */}
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 p-4 space-y-6">
                <section>
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 border-b border-emerald-100 pb-1">
                    Trading Account
                  </h4>
                  <div className="space-y-1">
                    {tradingCr.map((g) => (
                      <ProfitLossDrillDown key={g.groupName} item={g} />
                    ))}
                    {!isGrossProfit && (
                      <div className="flex justify-between py-2 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 font-bold text-xs uppercase italic">
                        <span>By Gross Loss c/d</span>
                        <span className="font-mono">{fmt(grossDiff)}</span>
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 border-b border-emerald-100 pb-1">
                    Profit & Loss Account
                  </h4>
                  <div className="space-y-1">
                    {plCr.map((g) => (
                      <ProfitLossDrillDown key={g.groupName} item={g} />
                    ))}
                    {!isNetProfit && (
                      <div className="flex justify-between py-2 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 font-bold text-xs uppercase italic">
                        <span>By Net Loss</span>
                        <span className="font-mono">{fmt(netDiff)}</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <div className="mt-auto flex justify-between px-6 py-4 bg-slate-900 text-white text-sm font-black border-t border-slate-700">
                <span>TOTAL CREDIT</span>
                <span className="font-mono">₹{fmt(plTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
