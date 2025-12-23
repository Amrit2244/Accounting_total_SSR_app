import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderOpen, ArrowUpRight } from "lucide-react";
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

  // ✅ FIXED: Added explicit : any types to the mapping functions
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
  // ✅ FIXED: Added explicit types to reduce
  const totalValue = vouchers.reduce(
    (sum: number, v: any) => sum + (v.totalAmount || 0),
    0
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col">
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
          <DaybookFilters />
          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-sm h-[34px]"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

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
                vouchers.map((v: any) => {
                  const primaryEntry = v.entries?.[0];
                  const pName = v.partyName ? v.partyName : null;
                  const ledgerName =
                    primaryEntry?.ledger?.name ||
                    pName ||
                    v.narration ||
                    "Unknown";
                  const amount = v.totalAmount || 0;

                  return (
                    <tr
                      key={`${v.type}-${v.id}`}
                      className="group hover:bg-blue-50/40 transition-colors text-[11px]"
                    >
                      <td className="py-2 px-4 font-bold text-slate-700 whitespace-nowrap">
                        {fmtDate(new Date(v.date))}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight 
                          ${
                            v.type === "SALES"
                              ? "bg-emerald-100 text-emerald-700"
                              : v.type === "PURCHASE"
                              ? "bg-amber-100 text-amber-700"
                              : v.type === "PAYMENT"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {v.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-slate-500">
                        #{v.voucherNo}
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-bold text-slate-800 uppercase tracking-tight">
                          {ledgerName}
                        </div>
                        <div className="text-[9px] text-slate-400 italic truncate max-w-[250px]">
                          {v.narration || "—"}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {fmt(amount)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {fmt(amount)}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <Link
                          href={`/companies/${companyId}/vouchers/${v.type.toLowerCase()}/${
                            v.id
                          }`}
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
