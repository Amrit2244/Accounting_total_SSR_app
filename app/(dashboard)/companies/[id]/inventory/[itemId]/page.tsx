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
  Filter,
  FileText,
  Layers,
} from "lucide-react";
import DateRangeFilter from "@/components/DateRangeFilter"; // Ensure you have this component

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

  // Formula: Opening + Purchase(In) - Sales(Out) + Journal(Net)
  // Assuming DB stores Sales Qty as Positive absolute. If negative, adjust sign.
  // Standard logic:
  const inQty = prePurch._sum.quantity || 0;
  const outQty = preSales._sum.quantity || 0; // Sales usually reduce stock
  const jrnQty = preJrn._sum.quantity || 0; // Journals can be +/-

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

  // --- 1. Date Logic (Default = All Time) ---
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

  // --- 4. Fetch Transactions (With Optional Date Filter) ---
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
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href={`/companies/${id}/inventory`}
              className="group p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-white hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                  Stock Item
                </span>
                {item.group && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                    {item.group.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {item.name}
              </h1>
              {item.partNumber && (
                <p className="text-slate-400 font-bold text-xs mt-1">
                  Part No: {item.partNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
              <Calendar size={18} />
            </div>
            <DateRangeFilter />
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard
            title="Opening Balance"
            value={openingBalance}
            unit={item.unit?.symbol}
            icon={<History />}
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
            icon={<ArrowDownLeft />}
            theme="green"
            subtext="Selected Period"
          />
          <SummaryCard
            title="Total Outwards"
            value={periodOut}
            unit={item.unit?.symbol}
            icon={<ArrowUpRight />}
            theme="red"
            subtext="Selected Period"
          />
          <SummaryCard
            title="Current Balance"
            value={currentBalance}
            unit={item.unit?.symbol}
            icon={<Package />}
            theme="blue"
            isMain
          />
        </div>

        {/* --- LEDGER TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              Item Ledger
            </h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-full">
              {history.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4 font-black">Date</th>
                  <th className="px-6 py-4 font-black">Details</th>
                  <th className="px-6 py-4 font-black text-right text-emerald-600 bg-emerald-50/30 border-l border-emerald-100/50">
                    Inwards
                  </th>
                  <th className="px-6 py-4 font-black text-right text-rose-600 bg-rose-50/30 border-l border-rose-100/50">
                    Outwards
                  </th>
                  <th className="px-6 py-4 font-black text-right">Rate</th>
                  <th className="px-6 py-4 font-black text-right text-slate-800 bg-slate-100/50 border-l border-slate-200/50">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* OPENING ROW */}
                <tr className="bg-yellow-50/20">
                  <td className="px-6 py-4 font-bold text-slate-400 text-xs">
                    {startDate ? format(startDate, "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase tracking-wide">
                      Opening Balance
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right bg-emerald-50/5 border-l border-emerald-100/20"></td>
                  <td className="px-6 py-4 text-right bg-rose-50/5 border-l border-rose-100/20"></td>
                  <td className="px-6 py-4 text-right"></td>
                  <td className="px-6 py-4 text-right font-black font-mono text-slate-800 text-xs bg-slate-50/30 border-l border-slate-100">
                    {openingBalance.toFixed(2)}{" "}
                    <span className="text-[9px] text-slate-400">
                      {item.unit?.symbol}
                    </span>
                  </td>
                </tr>

                {/* TRANSACTIONS */}
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-60">
                        <Package size={40} className="text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          No transactions found in this period
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {format(new Date(row.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                row.type === "SALES"
                                  ? "bg-rose-400"
                                  : row.type === "PURCHASE"
                                  ? "bg-emerald-400"
                                  : "bg-blue-400"
                              }`}
                            ></span>
                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                              {row.type.replace("_", " ")}
                            </span>
                          </div>
                          <Link
                            href={`/companies/${companyId}/vouchers/${row.type}/${row.voucherId}/edit`}
                            className="font-mono text-[11px] font-bold text-blue-500 hover:text-blue-700 hover:underline mt-0.5 pl-3.5"
                          >
                            #{row.voucherNo}
                          </Link>
                        </div>
                      </td>

                      {/* Inwards */}
                      <td className="px-6 py-3.5 text-right bg-emerald-50/5 group-hover:bg-emerald-50/10 border-l border-emerald-100/30 transition-colors">
                        {row.qtyIn > 0 ? (
                          <div className="font-mono text-xs font-bold text-emerald-700">
                            +{row.qtyIn.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>

                      {/* Outwards */}
                      <td className="px-6 py-3.5 text-right bg-rose-50/5 group-hover:bg-rose-50/10 border-l border-rose-100/30 transition-colors">
                        {row.qtyOut > 0 ? (
                          <div className="font-mono text-xs font-bold text-rose-700">
                            -{row.qtyOut.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-6 py-3.5 text-right font-mono text-xs font-medium text-slate-500">
                        {row.rate > 0
                          ? `₹${row.rate.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}`
                          : "-"}
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-3.5 text-right bg-slate-50/30 group-hover:bg-slate-100/50 border-l border-slate-200/50 transition-colors">
                        <div className="font-mono text-xs font-black text-slate-800">
                          {row.balance.toFixed(2)}
                        </div>
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
  const styles: any = {
    gray: "bg-white border-slate-200 text-slate-600",
    blue: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-blue-200",
    green: "bg-white border-slate-200 text-emerald-700",
    red: "bg-white border-slate-200 text-rose-700",
  };

  const iconStyles: any = {
    gray: "bg-slate-100 text-slate-500",
    blue: "bg-white/20 text-white",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-shadow ${styles[theme]}`}
    >
      {/* Background Decor */}
      {isMain && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      )}

      <div className="flex justify-between items-start z-10">
        <div className={`p-3 rounded-2xl ${iconStyles[theme]}`}>{icon}</div>
        {subtext && (
          <span
            className={`text-[9px] font-bold uppercase tracking-widest py-1 px-2 rounded-lg ${
              isMain
                ? "bg-white/10 text-blue-100"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            {subtext}
          </span>
        )}
      </div>

      <div className="z-10">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 ${
            isMain ? "text-blue-100" : "text-slate-400"
          }`}
        >
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h2 className="text-3xl font-black tracking-tight">
            {value.toLocaleString("en-IN")}
          </h2>
          <span
            className={`text-xs font-bold ${
              isMain ? "text-blue-200" : "text-slate-400"
            }`}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
