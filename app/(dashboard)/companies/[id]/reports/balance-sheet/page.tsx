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

  // --- 2. CALCULATE STOCK & P&L (Required for Balance Sheet) ---
  let openingStock = 0;
  let closingStock = 0;
  let closingStockDetails: { name: string; amount: number }[] = [];

  // Stock Valuation
  stockItems.forEach((item) => {
    // ✅ FIX: Removed 'item.openingRate' as it does not exist.
    // Just use 'item.openingValue'.
    const opVal = item.openingValue || 0;

    openingStock += opVal;

    let qty = item.openingQty || 0;
    let val = opVal;

    // Calculate Closing
    item.inventoryEntries.forEach((e) => {
      if (e.quantity > 0) {
        qty += e.quantity;
        val += e.amount;
      } else {
        qty -= Math.abs(e.quantity);
      }
    });

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
      closingStock += clVal;
      closingStockDetails.push({ name: item.name, amount: clVal });
    }
  });

  // Calculate Net Profit Internally
  let totalExpense = openingStock; // Opening Stock is an expense
  let totalIncome = closingStock; // Closing Stock is income

  ledgers.forEach((l) => {
    const net =
      (l.openingBalance || 0) + l.entries.reduce((s, e) => s + e.amount, 0);
    if (Math.abs(net) < 0.01) return;

    // ✅ FIX: Use optional chaining in case nature is null
    const nature = l.group?.nature?.toUpperCase();
    const gName = l.group?.name.toLowerCase() || "";
    const amt = Math.abs(net);

    // Identify P&L Items
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

  const netResult = totalIncome - totalExpense; // +ve Profit, -ve Loss
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

  ledgers.forEach((l) => {
    const net =
      (l.openingBalance || 0) + l.entries.reduce((s, e) => s + e.amount, 0);
    if (Math.abs(net) < 0.01) return;

    // ✅ FIX: Safety Check for group existence
    if (!l.group) return;

    const nature = l.group.nature?.toUpperCase();
    const gName = l.group.name.toLowerCase();

    // Skip P&L items (already processed)
    if (
      nature === "EXPENSE" ||
      nature === "INCOME" ||
      gName.includes("purchase") ||
      gName.includes("sales")
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

  // --- 4. INJECT SYSTEM ROWS ---

  // A. Net Profit -> Liability Side (Reserves & Surplus)
  if (isProfit && netResult > 0) {
    liabMap.set("Reserves & Surplus", {
      groupName: "Reserves & Surplus",
      amount: netResult,
      ledgers: [{ name: "Net Profit (Current Year)", amount: netResult }],
      isSystem: true,
    });
  }
  // B. Net Loss -> Asset Side (Profit & Loss A/c)
  else if (!isProfit && Math.abs(netResult) > 0) {
    assetMap.set("Profit & Loss A/c", {
      groupName: "Profit & Loss A/c",
      amount: Math.abs(netResult),
      ledgers: [
        { name: "Net Loss (Current Year)", amount: Math.abs(netResult) },
      ],
      isSystem: true,
    });
  }

  // C. Closing Stock -> Asset Side
  if (closingStock > 0) {
    assetMap.set("Closing Stock", {
      groupName: "Closing Stock",
      amount: closingStock,
      ledgers: closingStockDetails,
      isSystem: true,
    });
  }

  // --- 5. BUILD LISTS ---
  const liabilities = Array.from(liabMap.values());
  const assets = Array.from(assetMap.values());

  const totalLiab = liabilities.reduce((s, i) => s + i.amount, 0);
  const totalAsset = assets.reduce((s, i) => s + i.amount, 0);
  const grandTotal = Math.max(totalLiab, totalAsset);
  const diff = totalLiab - totalAsset;
  const isBalanced = Math.abs(diff) < 0.01;

  // Render Helper
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

      {/* REPORT CONTENT */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        {/* HEADERS */}
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

        {/* COLUMNS */}
        <div className="flex flex-1 min-h-0">
          {/* --- LIABILITIES --- */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1 p-1">
              {liabilities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[10px] uppercase font-bold italic">
                  No Liabilities Recorded
                </div>
              ) : (
                liabilities.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))
              )}
            </div>

            {/* Diff Check (Liability Side) */}
            {!isBalanced && diff < 0 && (
              <div className="px-3 py-2 bg-rose-50 text-rose-700 text-[10px] font-bold border-t border-rose-200">
                Difference in Liabilities: {fmt(Math.abs(diff))}
              </div>
            )}

            <TotalRow amount={grandTotal} />
          </div>

          {/* --- ASSETS --- */}
          <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1 p-1">
              {assets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[10px] uppercase font-bold italic">
                  No Assets Recorded
                </div>
              ) : (
                assets.map((group) => (
                  <ProfitLossDrillDown key={group.groupName} item={group} />
                ))
              )}
            </div>

            {/* Diff Check (Asset Side) */}
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
