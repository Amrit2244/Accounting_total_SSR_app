import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PieChart } from "lucide-react";
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
};

export default async function BalanceSheetPage({
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
    prisma.stockItem.findMany({
      where: { companyId },
      include: {
        salesItems: { where: { salesVoucher: { status: "APPROVED" } } },
        purchaseItems: { where: { purchaseVoucher: { status: "APPROVED" } } },
        journalEntries: { where: { stockJournal: { status: "APPROVED" } } },
      },
    }),
  ]);

  // --- 2. CALCULATE STOCK & P&L ---
  let openingStock = 0;
  let closingStock = 0;
  let closingStockDetails: { name: string; amount: number }[] = [];

  // ✅ FIXED: Added : any to item
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

  // --- 3. CLASSIFY ASSETS & LIABILITIES ---
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

  // ✅ FIXED: Added : any to s and i
  const totalLiab = liabilities.reduce((s: number, i: any) => s + i.amount, 0);
  const totalAsset = assets.reduce((s: number, i: any) => s + i.amount, 0);
  const grandTotal = Math.max(totalLiab, totalAsset);
  const diff = totalLiab - totalAsset;
  const isBalanced = Math.abs(diff) < 0.01;

  const TotalRow = ({ amount }: { amount: number }) => (
    <div className="flex justify-between px-3 py-2 bg-slate-100 border-t border-slate-200 border-b-4 border-double border-b-slate-400 font-black text-xs text-slate-900 mt-auto">
      <span>Total</span>
      <span className="font-mono">{fmt(amount)}</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col font-sans">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <PieChart size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Balance Sheet
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              As on{" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        <div className="flex border-b border-slate-200 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shrink-0">
          <div className="w-1/2 flex justify-between px-4 py-2 border-r border-slate-700">
            <span>Liabilities</span>
            <span>Amount (₹)</span>
          </div>
          <div className="w-1/2 flex justify-between px-4 py-2">
            <span>Assets</span>
            <span>Amount (₹)</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1 p-1">
              {liabilities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[10px] uppercase font-bold italic">
                  No Liabilities Recorded
                </div>
              ) : (
                liabilities.map((group: any) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))
              )}
            </div>
            {!isBalanced && diff < 0 && (
              <div className="px-3 py-2 bg-rose-50 text-rose-700 text-[10px] font-bold border-t border-rose-200">
                Difference in Liabilities: {fmt(Math.abs(diff))}
              </div>
            )}
            <TotalRow amount={grandTotal} />
          </div>

          <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1 p-1">
              {assets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[10px] uppercase font-bold italic">
                  No Assets Recorded
                </div>
              ) : (
                assets.map((group: any) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))
              )}
            </div>
            {!isBalanced && diff > 0 && (
              <div className="px-3 py-2 bg-rose-50 text-rose-700 text-[10px] font-bold border-t border-rose-200">
                Difference in Assets: {fmt(Math.abs(diff))}
              </div>
            )}
            <TotalRow amount={grandTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}
