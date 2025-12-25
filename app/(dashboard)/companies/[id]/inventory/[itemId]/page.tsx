import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Layers,
  ChevronRight,
  Hash,
} from "lucide-react";
import DateRangeFilter from "@/components/DateRangeFilter";

// --- HELPER: Calculate Opening Balance Dynamic ---
async function getOpeningBalance(
  itemId: number,
  companyId: number,
  fromDate?: Date
) {
  // Base Opening from Master
  const item = await prisma.stockItem.findUnique({
    where: { id: itemId },
    select: { openingQty: true },
  });
  if (!item) return 0;

  // If no date filter, Opening is just the master opening
  if (!fromDate) return item.openingQty || 0;

  // Otherwise, calculate sum of transactions BEFORE the fromDate
  const [preSales, prePurch, preJrn] = await Promise.all([
    prisma.salesItemEntry.aggregate({
      _sum: { quantity: true },
      where: {
        stockItemId: itemId,
        salesVoucher: { date: { lt: fromDate }, status: "APPROVED" },
      },
    }),
    prisma.purchaseItemEntry.aggregate({
      _sum: { quantity: true },
      where: {
        stockItemId: itemId,
        purchaseVoucher: { date: { lt: fromDate }, status: "APPROVED" },
      },
    }),
    prisma.stockJournalEntry.aggregate({
      _sum: { quantity: true },
      where: {
        stockItemId: itemId,
        stockJournal: { date: { lt: fromDate }, status: "APPROVED" },
      },
    }),
  ]);

  const inQty = prePurch._sum.quantity || 0;
  const outQty = preSales._sum.quantity || 0;
  const jrnQty = preJrn._sum.quantity || 0;

  return (item.openingQty || 0) + inQty - outQty + jrnQty;
}

export default async function StockItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; itemId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id, itemId } = await params;
  const p = await searchParams;
  const companyId = parseInt(id);
  const sItemId = parseInt(itemId);

  // --- 1. Date Logic ---
  const startDate = p.from ? new Date(p.from) : undefined;
  const endDate = p.to ? new Date(p.to) : undefined;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  // --- 2. Fetch Master Data ---
  const item = await prisma.stockItem.findUnique({
    where: { id: sItemId },
    include: { unit: true, group: true },
  });

  if (!item || item.companyId !== companyId) return notFound();

  // --- 3. Calculate Opening Balance ---
  const openingBalance = await getOpeningBalance(sItemId, companyId, startDate);

  // --- 4. Fetch Transactions ---
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.date = { gte: startDate, lte: endDate };
  } else if (startDate) {
    dateFilter.date = { gte: startDate };
  } else if (endDate) {
    dateFilter.date = { lte: endDate };
  }

  const [salesEntries, purchaseEntries, journalEntries] = await Promise.all([
    prisma.salesItemEntry.findMany({
      where: {
        stockItemId: sItemId,
        salesVoucher: { ...dateFilter, status: "APPROVED" },
      },
      include: { salesVoucher: true },
    }),
    prisma.purchaseItemEntry.findMany({
      where: {
        stockItemId: sItemId,
        purchaseVoucher: { ...dateFilter, status: "APPROVED" },
      },
      include: { purchaseVoucher: true },
    }),
    prisma.stockJournalEntry.findMany({
      where: {
        stockItemId: sItemId,
        stockJournal: { ...dateFilter, status: "APPROVED" },
      },
      include: { stockJournal: true },
    }),
  ]);

  // --- 5. Normalize & Sort ---
  const movements = [
    ...salesEntries.map((e: any) => ({
      id: `sale-${e.id}`,
      date: e.salesVoucher.date,
      type: "SALES",
      voucherNo: e.salesVoucher.voucherNo,
      voucherId: e.salesVoucher.id,
      qtyIn: 0,
      qtyOut: Math.abs(e.quantity),
      rate: e.rate,
    })),
    ...purchaseEntries.map((e: any) => ({
      id: `purch-${e.id}`,
      date: e.purchaseVoucher.date,
      type: "PURCHASE",
      voucherNo: e.purchaseVoucher.voucherNo,
      voucherId: e.purchaseVoucher.id,
      qtyIn: Math.abs(e.quantity),
      qtyOut: 0,
      rate: e.rate,
    })),
    ...journalEntries.map((e: any) => ({
      id: `jrn-${e.id}`,
      date: e.stockJournal.date,
      type: "STOCK_JOURNAL",
      voucherNo: e.stockJournal.voucherNo,
      voucherId: e.stockJournal.id,
      qtyIn: e.quantity > 0 ? e.quantity : 0,
      qtyOut: e.quantity < 0 ? Math.abs(e.quantity) : 0,
      rate: e.rate,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- 6. Calculate Running History ---
  let currentBalance = openingBalance;
  let periodIn = 0;
  let periodOut = 0;

  const history = movements.map((m) => {
    currentBalance = currentBalance + m.qtyIn - m.qtyOut;
    periodIn += m.qtyIn;
    periodOut += m.qtyOut;
    return { ...m, balance: currentBalance };
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <Link
                href={`/companies/${companyId}/inventory`}
                className="hover:text-indigo-600 transition-colors"
              >
                Inventory
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Item Detail</span>
            </div>

            <div className="flex items-start gap-4">
              <Link
                href={`/companies/${companyId}/inventory`}
                className="mt-1 p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  {item.name}
                  {item.group && (
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-100">
                      {item.group.name}
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  {item.partNumber && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Hash size={12} className="text-slate-400" />
                      Part:{" "}
                      <span className="font-mono font-bold text-slate-700">
                        {item.partNumber}
                      </span>
                    </div>
                  )}
                  {item.unit && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Package size={12} className="text-slate-400" />
                      Base Unit:{" "}
                      <span className="font-bold text-slate-700">
                        {item.unit.symbol}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="px-3 text-slate-400 border-r border-slate-100">
              <Calendar size={18} />
            </div>
            <DateRangeFilter />
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Opening Balance"
            value={openingBalance}
            unit={item.unit?.symbol}
            icon={<History size={18} />}
            theme="gray"
            subtext={
              startDate
                ? `As of ${format(startDate, "dd MMM")}`
                : "Initial Stock"
            }
          />
          <SummaryCard
            title="Total Inwards"
            value={periodIn}
            unit={item.unit?.symbol}
            icon={<ArrowDownLeft size={18} />}
            theme="emerald"
            subtext="Period Addition"
          />
          <SummaryCard
            title="Total Outwards"
            value={periodOut}
            unit={item.unit?.symbol}
            icon={<ArrowUpRight size={18} />}
            theme="rose"
            subtext="Period Reduction"
          />
          <SummaryCard
            title="Current Balance"
            value={currentBalance}
            unit={item.unit?.symbol}
            icon={<Layers size={18} />}
            theme="indigo"
            subtext="Available Stock"
            isMain
          />
        </div>

        {/* --- LEDGER TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Table Header Info */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Item Ledger
              </h3>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500 font-medium">
                {history.length} Transactions
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4 font-bold w-32">Date</th>
                  <th className="px-6 py-4 font-bold">Particulars</th>
                  <th className="px-6 py-4 font-bold text-right w-32 bg-emerald-50/30 border-l border-emerald-100/50 text-emerald-600">
                    Inwards
                  </th>
                  <th className="px-6 py-4 font-bold text-right w-32 bg-rose-50/30 border-l border-rose-100/50 text-rose-600">
                    Outwards
                  </th>
                  <th className="px-6 py-4 font-bold text-right w-32">Rate</th>
                  <th className="px-6 py-4 font-bold text-right w-32 bg-slate-50 border-l border-slate-200">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* OPENING ROW */}
                <tr className="bg-amber-50/30">
                  <td className="px-6 py-4 font-bold text-slate-500 text-xs">
                    {startDate ? format(startDate, "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
                      Opening Balance
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right bg-emerald-50/5 border-l border-emerald-100/20"></td>
                  <td className="px-6 py-4 text-right bg-rose-50/5 border-l border-rose-100/20"></td>
                  <td className="px-6 py-4 text-right"></td>
                  <td className="px-6 py-4 text-right font-black font-mono text-slate-800 text-xs bg-slate-50/50 border-l border-slate-200">
                    {openingBalance.toFixed(2)}
                  </td>
                </tr>

                {/* TRANSACTIONS */}
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                        <Package size={20} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        No transactions found
                      </p>
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-600 whitespace-nowrap">
                        {format(new Date(row.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                row.type === "SALES"
                                  ? "bg-rose-500"
                                  : row.type === "PURCHASE"
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              {row.type.replace("_", " ")}
                            </span>
                          </div>
                          <Link
                            href={`/companies/${companyId}/vouchers/${row.type}/${row.voucherId}/edit`}
                            className="font-mono text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline mt-0.5 pl-3.5"
                          >
                            #{row.voucherNo}
                          </Link>
                        </div>
                      </td>

                      {/* Inwards */}
                      <td className="px-6 py-3.5 text-right bg-emerald-50/10 group-hover:bg-emerald-50/20 border-l border-emerald-100/30">
                        {row.qtyIn > 0 && (
                          <span className="font-mono text-xs font-bold text-emerald-600">
                            +{row.qtyIn.toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>

                      {/* Outwards */}
                      <td className="px-6 py-3.5 text-right bg-rose-50/10 group-hover:bg-rose-50/20 border-l border-rose-100/30">
                        {row.qtyOut > 0 && (
                          <span className="font-mono text-xs font-bold text-rose-600">
                            -{row.qtyOut.toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-6 py-3.5 text-right font-mono text-xs font-medium text-slate-500">
                        {row.rate > 0
                          ? `₹${row.rate.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-3.5 text-right bg-slate-50/50 group-hover:bg-slate-100 border-l border-slate-200">
                        <span className="font-mono text-xs font-black text-slate-800">
                          {row.balance.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- UI COMPONENT: Summary Card ---
function SummaryCard({
  title,
  value,
  unit,
  icon,
  theme,
  isMain,
  subtext,
}: any) {
  const themes: any = {
    gray: {
      bg: "bg-white",
      text: "text-slate-600",
      icon: "bg-slate-50 text-slate-500",
      border: "border-slate-200",
    },
    indigo: {
      bg: "bg-slate-900",
      text: "text-white",
      icon: "bg-white/10 text-indigo-300",
      border: "border-slate-900",
    },
    emerald: {
      bg: "bg-white",
      text: "text-emerald-700",
      icon: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    rose: {
      bg: "bg-white",
      text: "text-rose-700",
      icon: "bg-rose-50 text-rose-600",
      border: "border-rose-100",
    },
  };

  const t = themes[theme] || themes.gray;

  return (
    <div
      className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:shadow-md ${t.bg} ${t.border}`}
    >
      {isMain && (
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      )}

      <div className="flex justify-between items-start z-10">
        <div className={`p-2 rounded-xl ${t.icon}`}>{icon}</div>
        {subtext && (
          <span
            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
              isMain
                ? "bg-white/10 text-indigo-200"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            {subtext}
          </span>
        )}
      </div>

      <div className="z-10 mt-2">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
            isMain ? "text-indigo-200" : "text-slate-400"
          }`}
        >
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h2 className={`text-2xl font-black tracking-tight ${t.text}`}>
            {value.toLocaleString("en-IN")}
          </h2>
          <span
            className={`text-xs font-bold ${
              isMain ? "text-indigo-300" : "text-slate-400"
            }`}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
