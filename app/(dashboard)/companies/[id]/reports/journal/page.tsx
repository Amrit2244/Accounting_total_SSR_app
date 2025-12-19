import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Hash,
} from "lucide-react";
import DaybookFilters from "@/components/reports/DaybookFilters"; // Import the component above

const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default async function DaybookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; type?: string }>;
}) {
  const { id } = await params;
  const { from, to, type } = await searchParams;
  const companyId = parseInt(id);

  // Default Dates: Today
  const today = new Date().toISOString().split("T")[0];
  const startDate = from ? new Date(from) : new Date(today);
  const endDate = to ? new Date(to) : new Date(today);

  // Adjust time to cover full day
  const startISO = new Date(startDate.setHours(0, 0, 0, 0));
  const endISO = new Date(endDate.setHours(23, 59, 59, 999));

  // Build Where Clause
  const whereClause: any = {
    companyId,
    date: { gte: startISO, lte: endISO },
  };

  if (type && type !== "ALL") {
    whereClause.type = type;
  }

  // Fetch Vouchers
  const vouchers = await prisma.voucher.findMany({
    where: whereClause,
    include: {
      entries: {
        include: { ledger: { select: { name: true } } },
      },
    },
    orderBy: { date: "asc" }, // Chronological order
  });

  // Calculate Totals for the View
  const totalTransactions = vouchers.length;
  const totalValue = vouchers.reduce(
    (sum, v) =>
      sum +
      v.entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0),
    0
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-slate-900 rounded text-white shadow-sm">
            <FolderOpen size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Daybook Register
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {vouchers.length} Entries • ₹ {fmt(totalValue)} Turnover
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* CLIENT FILTERS */}
          <DaybookFilters />

          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-sm h-[34px]"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {/* MAIN REGISTER TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
              <tr className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                <th className="py-2.5 px-4 text-left w-[120px] bg-slate-50">
                  Date
                </th>
                <th className="py-2.5 px-4 text-left w-[140px] bg-slate-50">
                  Voucher Type
                </th>
                <th className="py-2.5 px-4 text-left w-[100px] bg-slate-50">
                  Vch No.
                </th>
                <th className="py-2.5 px-4 text-left bg-slate-50">
                  Particulars (Ledger)
                </th>
                <th className="py-2.5 px-4 text-right w-[140px] bg-slate-50">
                  Debit Amount
                </th>
                <th className="py-2.5 px-4 text-right w-[140px] bg-slate-50">
                  Credit Amount
                </th>
                <th className="py-2.5 px-4 text-center w-[80px] bg-slate-50">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-slate-400 italic text-xs font-bold uppercase"
                  >
                    No vouchers found for this period.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  // Determine primary ledger (Party) for display
                  // Usually the first entry that isn't Cash/Bank, or the first entry generally
                  const primaryEntry = v.entries[0];
                  const totalVchAmount = v.entries
                    .filter((e) => e.amount > 0)
                    .reduce((sum, e) => sum + e.amount, 0);

                  return (
                    <tr
                      key={v.id}
                      className="group hover:bg-blue-50/40 transition-colors text-[11px]"
                    >
                      <td className="py-2 px-4 font-bold text-slate-700 whitespace-nowrap">
                        {fmtDate(v.date)}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                            v.type === "SALES"
                              ? "bg-emerald-100 text-emerald-700"
                              : v.type === "PURCHASE"
                              ? "bg-amber-100 text-amber-700"
                              : v.type === "PAYMENT"
                              ? "bg-rose-100 text-rose-700"
                              : v.type === "RECEIPT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {v.type}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-slate-500">
                        #{v.voucherNo}
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-bold text-slate-800 uppercase tracking-tight">
                          {primaryEntry?.ledger?.name || "Unknown Ledger"}
                        </div>
                        <div className="text-[9px] text-slate-400 italic truncate max-w-[250px]">
                          {v.narration || "—"}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {fmt(totalVchAmount)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {fmt(totalVchAmount)}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <Link
                          href={`/companies/${companyId}/vouchers/${v.id}`}
                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:underline"
                        >
                          View <ArrowUpRight size={10} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* COMPACT FOOTER */}
        <div className="bg-slate-900 text-white px-6 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest shrink-0">
          <div className="flex gap-4 opacity-70">
            <span>Rows: {totalTransactions}</span>
            <span>
              Period: {from ? fmtDate(startDate) : "Today"} to{" "}
              {to ? fmtDate(endDate) : "Today"}
            </span>
          </div>
          <div className="flex gap-6">
            <span className="text-emerald-400">
              Total Dr: ₹ {fmt(totalValue)}
            </span>
            <span className="text-blue-400">Total Cr: ₹ {fmt(totalValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
