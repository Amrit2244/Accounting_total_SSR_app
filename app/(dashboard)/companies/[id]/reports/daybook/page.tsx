import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FolderOpen,
  ArrowUpRight,
  ChevronRight,
  CalendarDays,
  Filter,
  ArrowLeft,
  ShieldCheck, // Icon for Admin Auto-Verified
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

  const startISO = new Date(startDate);
  startISO.setHours(0, 0, 0, 0);

  const endISO = new Date(endDate);
  endISO.setHours(23, 59, 59, 999);

  // Build Where Clause
  const whereClause: any = {
    companyId,
    date: { gte: startISO, lte: endISO },
    status: "APPROVED", // Includes Admin Auto-Verified & Standard Approved
  };

  // Include verifier role to detect Admin bypass
  const commonInclude = {
    ledgerEntries: { include: { ledger: true } },
    verifiedBy: { select: { role: true, name: true } },
  };

  const [sales, purchase, payment, receipt, contra, journal, stock] =
    await Promise.all([
      !type || type === "ALL" || type === "SALES"
        ? prisma.salesVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "PURCHASE"
        ? prisma.purchaseVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "PAYMENT"
        ? prisma.paymentVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "RECEIPT"
        ? prisma.receiptVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "CONTRA"
        ? prisma.contraVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "JOURNAL"
        ? prisma.journalVoucher.findMany({
            where: whereClause,
            include: commonInclude,
          })
        : [],
      !type || type === "ALL" || type === "STOCK_JOURNAL"
        ? prisma.stockJournal.findMany({
            where: whereClause,
            include: { verifiedBy: { select: { role: true } } },
          })
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

  const totalValue = vouchers.reduce(
    (sum: number, v: any) => sum + (v.totalAmount || 0),
    0
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

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 flex flex-col h-full space-y-6 flex-1">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Daybook</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <FolderOpen className="text-indigo-600" size={32} />
              Daybook Register
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Audit Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-tighter">
                Verified Audit Log
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex items-center">
              <div className="px-3 text-slate-400 border-r border-slate-100">
                <Filter size={16} />
              </div>
              <DaybookFilters />
            </div>
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-6 w-[120px]">Date</th>
                  <th className="py-3 px-6 w-[140px]">Type</th>
                  <th className="py-3 px-6 w-[100px]">Vch No.</th>
                  <th className="py-3 px-6">Particulars</th>
                  <th className="py-3 px-6 text-right w-[160px]">Amount</th>
                  <th className="py-3 px-6 text-center w-[120px]">Auth Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v: any) => {
                  const isAutoVerified =
                    v.verifiedBy?.role === "ADMIN" &&
                    v.createdById === v.verifiedById;
                  const ledgerName =
                    v.entries?.[0]?.ledger?.name || v.partyName || "Unknown";

                  return (
                    <tr
                      key={`${v.type}-${v.id}`}
                      className="group hover:bg-slate-50/50"
                    >
                      <td className="py-4 px-6 text-xs font-bold text-slate-600">
                        {fmtDate(new Date(v.date))}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wide ${
                            v.type === "SALES"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-100"
                          }`}
                        >
                          {v.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-mono font-bold text-slate-500">
                        #{v.voucherNo}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-slate-800">
                          {ledgerName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {v.transactionCode}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-xs font-black text-slate-900">
                        ₹ {fmt(v.totalAmount || 0)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isAutoVerified ? (
                          <div
                            className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase"
                            title="Admin Auto-Verified"
                          >
                            <ShieldCheck size={10} />
                            Admin
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex gap-6">
              <span>
                Entries: <span className="text-white">{vouchers.length}</span>
              </span>
              <span>
                Range:{" "}
                <span className="text-white">
                  {fmtDate(startDate)} - {fmtDate(endDate)}
                </span>
              </span>
            </div>
            <div className="flex gap-8 items-center">
              <span className="flex items-center gap-2">
                Total Volume:{" "}
                <span className="text-white text-sm font-black">
                  ₹ {fmt(totalValue)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
