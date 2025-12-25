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

  // Common Filter for all Ledger Entries
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

  // --- 3. CALCULATE STOCK & P&L ---
  let openingStock = 0;
  let closingStock = 0;
  let closingStockDetails: { name: string; amount: number }[] = [];

  stockItems.forEach((item: any) => {
    const opVal = item.openingValue || 0;
    openingStock += opVal;

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

    if (Math.abs(net) < 0.01) return;
    if (!l.group) return;

    const nature = l.group.nature?.toUpperCase();
    const gName = l.group.name.toLowerCase();
    const amt = Math.abs(net);

    const isExp =
      nature === "EXPENSE" ||
      gName.includes("purchase") ||
      gName.includes("direct exp") ||
      gName.includes("indirect exp");
    const isInc =
      nature === "INCOME" ||
      gName.includes("sales") ||
      gName.includes("direct inc") ||
      gName.includes("indirect inc");

    if (isExp) totalExpense += amt;
    else if (isInc) totalIncome += amt;
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
    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const net = (l.openingBalance || 0) + txTotal;

    if (Math.abs(net) < 0.01) return;
    if (!l.group) return;

    const nature = l.group.nature?.toUpperCase();
    const gName = l.group.name.toLowerCase();

    if (
      nature === "EXPENSE" ||
      nature === "INCOME" ||
      gName.includes("purchase") ||
      gName.includes("sales") ||
      gName.includes("direct") ||
      gName.includes("indirect")
    )
      return;

    if (
      nature === "LIABILITY" ||
      nature === "CAPITAL" ||
      gName.includes("capital") ||
      gName.includes("creditor")
    ) {
      addToMap(liabMap, l.group.name, l.name, Math.abs(net));
    } else if (
      nature === "ASSET" ||
      gName.includes("asset") ||
      gName.includes("debtor") ||
      gName.includes("bank") ||
      gName.includes("cash")
    ) {
      addToMap(assetMap, l.group.name, l.name, Math.abs(net));
    }
  });

  if (isProfit && netResult > 0) {
    liabMap.set("Reserves & Surplus", {
      groupName: "Reserves & Surplus",
      amount: netResult,
      ledgers: [{ name: "Net Profit (Current Year)", amount: netResult }],
      isSystem: true,
    });
  } else if (!isProfit && Math.abs(netResult) > 0) {
    assetMap.set("Profit & Loss A/c", {
      groupName: "Profit & Loss A/c",
      amount: Math.abs(netResult),
      ledgers: [
        { name: "Net Loss (Current Year)", amount: Math.abs(netResult) },
      ],
      isSystem: true,
    });
  }

  if (closingStock > 0) {
    assetMap.set("Closing Stock", {
      groupName: "Closing Stock",
      amount: closingStock,
      ledgers: closingStockDetails,
      isSystem: true,
    });
  }

  const liabilities = Array.from(liabMap.values());
  const assets = Array.from(assetMap.values());

  const totalLiab = liabilities.reduce((s: number, i: any) => s + i.amount, 0);
  const totalAsset = assets.reduce((s: number, i: any) => s + i.amount, 0);
  const grandTotal = Math.max(totalLiab, totalAsset);
  const diff = totalLiab - totalAsset;
  const isBalanced = Math.abs(diff) < 0.01;

  const TotalRow = ({ amount }: { amount: number }) => (
    <div className="flex justify-between px-6 py-4 bg-slate-100 border-t border-slate-200 mt-auto">
      <span className="font-black text-xs uppercase tracking-widest text-slate-900">
        Total
      </span>
      <span className="font-mono font-bold text-sm text-slate-900">
        ₹{fmt(amount)}
      </span>
    </div>
  );

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
              <span className="text-slate-900">Balance Sheet</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <PieChart className="text-indigo-600" size={32} />
              Balance Sheet
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Financial position statement as of{" "}
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
          {/* Table Header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-1/2 px-6 py-3 border-r border-slate-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-600">
              <span>Liabilities</span>
              <span>Amount (₹)</span>
            </div>
            <div className="w-1/2 px-6 py-3 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-600">
              <span>Assets</span>
              <span>Amount (₹)</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex flex-1 min-h-0">
            {/* Liabilities Column */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-50/10">
              <div className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {liabilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wide">
                      No Liabilities
                    </span>
                  </div>
                ) : (
                  liabilities.map((group: any) => (
                    <ProfitLossDrillDown key={group.groupName} item={group} />
                  ))
                )}
              </div>

              {!isBalanced && diff < 0 && (
                <div className="px-6 py-3 bg-rose-50 border-t border-rose-100 text-rose-700 text-xs font-bold flex justify-between">
                  <span>Difference in Liabilities</span>
                  <span className="font-mono">{fmt(Math.abs(diff))}</span>
                </div>
              )}
              <TotalRow amount={grandTotal} />
            </div>

            {/* Assets Column */}
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wide">
                      No Assets
                    </span>
                  </div>
                ) : (
                  assets.map((group: any) => (
                    <ProfitLossDrillDown key={group.groupName} item={group} />
                  ))
                )}
              </div>

              {!isBalanced && diff > 0 && (
                <div className="px-6 py-3 bg-rose-50 border-t border-rose-100 text-rose-700 text-xs font-bold flex justify-between">
                  <span>Difference in Assets</span>
                  <span className="font-mono">{fmt(Math.abs(diff))}</span>
                </div>
              )}
              <TotalRow amount={grandTotal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
