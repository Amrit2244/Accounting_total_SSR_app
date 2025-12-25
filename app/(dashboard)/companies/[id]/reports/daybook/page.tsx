import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOpen,
  ArrowUpRight,
  ChevronRight,
  CalendarDays,
  Filter,
} from "lucide-react";
import DaybookFilters from "@/components/reports/DaybookFilters";

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
  const startISO = new Date(startDate);
  startISO.setHours(0, 0, 0, 0);

  const endISO = new Date(endDate);
  endISO.setHours(23, 59, 59, 999);

  // Build Where Clause
  const whereClause: any = {
    companyId,
    date: { gte: startISO, lte: endISO },
    status: "APPROVED",
  };

  const [sales, purchase, payment, receipt, contra, journal, stock] =
    await Promise.all([
      !type || type === "ALL" || type === "SALES"
        ? prisma.salesVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "PURCHASE"
        ? prisma.purchaseVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "PAYMENT"
        ? prisma.paymentVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "RECEIPT"
        ? prisma.receiptVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "CONTRA"
        ? prisma.contraVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "JOURNAL"
        ? prisma.journalVoucher.findMany({
            where: whereClause,
            include: { ledgerEntries: { include: { ledger: true } } },
          })
        : [],
      !type || type === "ALL" || type === "STOCK_JOURNAL"
        ? prisma.stockJournal.findMany({ where: whereClause })
        : [],
    ]);

  const vouchers = [
    ...sales.map((v: any) => ({
      ...v,
      type: "SALES",
      entries: v.ledgerEntries,
    })),
    ...purchase.map((v: any) => ({
      ...v,
      type: "PURCHASE",
      entries: v.ledgerEntries,
    })),
    ...payment.map((v: any) => ({
      ...v,
      type: "PAYMENT",
      entries: v.ledgerEntries,
    })),
    ...receipt.map((v: any) => ({
      ...v,
      type: "RECEIPT",
      entries: v.ledgerEntries,
    })),
    ...contra.map((v: any) => ({
      ...v,
      type: "CONTRA",
      entries: v.ledgerEntries,
    })),
    ...journal.map((v: any) => ({
      ...v,
      type: "JOURNAL",
      entries: v.ledgerEntries,
    })),
    ...stock.map((v: any) => ({
      ...v,
      type: "STOCK_JOURNAL",
      entries: [],
      totalAmount: 0,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalTransactions = vouchers.length;
  const totalValue = vouchers.reduce(
    (sum: number, v: any) => sum + (v.totalAmount || 0),
    0
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

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 flex flex-col h-full space-y-6 flex-1">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
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
              <span className="text-slate-900">Daybook</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <FolderOpen className="text-indigo-600" size={32} />
              Daybook Register
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Detailed chronological record of all financial transactions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Component */}
            <div className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex items-center">
              <div className="px-3 text-slate-400 border-r border-slate-100">
                <Filter size={16} />
              </div>
              <DaybookFilters />
            </div>

            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Reports"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* MAIN TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-6 w-[120px]">Date</th>
                  <th className="py-3 px-6 w-[140px]">Type</th>
                  <th className="py-3 px-6 w-[100px]">Vch No.</th>
                  <th className="py-3 px-6">Particulars</th>
                  <th className="py-3 px-6 text-right w-[160px]">Debit</th>
                  <th className="py-3 px-6 text-right w-[160px]">Credit</th>
                  <th className="py-3 px-6 text-center w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarDays className="text-slate-300" size={32} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        No Entries Found
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting the date range or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v: any) => {
                    const primaryEntry = v.entries?.[0];
                    const pName = v.partyName ? v.partyName : null;
                    const ledgerName =
                      primaryEntry?.ledger?.name ||
                      pName ||
                      v.narration ||
                      "Unknown";
                    const amount = v.totalAmount || 0;

                    // Voucher Type Styling
                    let typeClass =
                      "bg-slate-100 text-slate-600 border-slate-200";
                    if (v.type === "SALES")
                      typeClass =
                        "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (v.type === "PURCHASE")
                      typeClass = "bg-blue-50 text-blue-700 border-blue-100";
                    if (v.type === "PAYMENT")
                      typeClass = "bg-amber-50 text-amber-700 border-amber-100";
                    if (v.type === "RECEIPT")
                      typeClass =
                        "bg-indigo-50 text-indigo-700 border-indigo-100";
                    if (v.type === "CONTRA")
                      typeClass =
                        "bg-purple-50 text-purple-700 border-purple-100";

                    return (
                      <tr
                        key={`${v.type}-${v.id}`}
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-6 text-xs font-bold text-slate-600 whitespace-nowrap">
                          {fmtDate(new Date(v.date))}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wide ${typeClass}`}
                          >
                            {v.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs font-mono font-bold text-slate-500">
                          #{v.voucherNo}
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm font-bold text-slate-800">
                            {ledgerName}
                          </div>
                          {v.narration && (
                            <div className="text-[10px] text-slate-400 italic truncate max-w-[300px] mt-0.5">
                              {v.narration}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-xs font-bold text-slate-900">
                          {fmt(amount)}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-xs font-bold text-slate-900">
                          {fmt(amount)}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <Link
                            href={`/companies/${companyId}/vouchers/${v.type.toLowerCase()}/${
                              v.id
                            }/edit`}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* FOOTER TOTALS */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            <div className="flex gap-6">
              <span>
                Rows: <span className="text-white">{totalTransactions}</span>
              </span>
              <span>
                Period:{" "}
                <span className="text-white">
                  {from ? fmtDate(startDate) : "Today"} —{" "}
                  {to ? fmtDate(endDate) : "Today"}
                </span>
              </span>
            </div>
            <div className="flex gap-8">
              <div>
                Total Dr:{" "}
                <span className="text-emerald-400 text-xs ml-2">
                  ₹ {fmt(totalValue)}
                </span>
              </div>
              <div>
                Total Cr:{" "}
                <span className="text-blue-400 text-xs ml-2">
                  ₹ {fmt(totalValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
