import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Search,
  ArrowLeft,
  ListFilter,
  CreditCard,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { getVouchers } from "@/app/actions/voucher";
import QuickVerify from "@/components/QuickVerify";
import DateRangeFilter from "@/components/DateRangeFilter";
import VoucherSearch from "@/components/VoucherSearch";
import VoucherListClient from "@/components/VoucherListClient";

export default async function VoucherListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const { id } = await params;
  const p = await searchParams;
  const companyId = parseInt(id);

  let startDate: Date;
  let endDate: Date;
  let isLatestData = false;

  // --- Date Logic ---
  if (p.from && p.to) {
    startDate = new Date(p.from);
    endDate = new Date(p.to);
  } else {
    // Auto-detect the last day with activity
    const [s, pu, pa, r, c, j] = await Promise.all([
      prisma.salesVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.purchaseVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.paymentVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.receiptVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.contraVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.journalVoucher.findFirst({
        where: { companyId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ]);

    const allDates = [s?.date, pu?.date, pa?.date, r?.date, c?.date, j?.date]
      .filter((d): d is Date => !!d)
      .map((d) => d.getTime());

    if (allDates.length > 0) {
      const maxTimestamp = Math.max(...allDates);
      const maxDateStr = new Date(maxTimestamp).toISOString().split("T")[0];
      startDate = new Date(maxDateStr);
      endDate = new Date(maxDateStr);
      isLatestData = true;
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      startDate = new Date(todayStr);
      endDate = new Date(todayStr);
    }
  }

  endDate.setHours(23, 59, 59, 999);

  const vouchers = await getVouchers(companyId, startDate, endDate, p.q);
  const baseUrl = `/companies/${id}/vouchers`;
  const isFiltered = !!(p.from && p.to);

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

      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Title & Breadcrumbs */}
          <div className="flex items-start gap-4">
            <Link
              href={`/companies/${id}`}
              className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard size={20} className="text-slate-400" />
                Daybook Transactions
              </h1>

              <div className="flex items-center gap-3 mt-1.5">
                {/* Date Pill */}
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
                  <Calendar size={12} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">
                    {format(startDate, "dd MMM yyyy")}
                    {startDate.toDateString() !== endDate.toDateString() &&
                      ` — ${format(endDate, "dd MMM yyyy")}`}
                  </span>
                </div>

                {/* Status Text */}
                {!isFiltered && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isLatestData ? "Latest Activity" : "Today"}
                  </span>
                )}

                {/* Counter Separator */}
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-500">
                  {vouchers.length} Entries
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Group */}
            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
              <DateRangeFilter />
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <VoucherSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pl-2">
              <QuickVerify companyId={companyId} />

              <Link
                href={`/companies/${companyId}/vouchers/create`}
                className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
              >
                <Plus
                  size={16}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                <span>New Entry</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 relative z-10 p-6 overflow-hidden">
        <div className="h-full max-w-[1920px] mx-auto flex flex-col">
          {/* Table Container */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            {/* Empty State Overlay */}
            {vouchers.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 bg-white/50 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ListFilter className="text-slate-300" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No Transactions Found
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  There are no vouchers recorded for this date range.
                </p>
                {!isFiltered && (
                  <p className="text-xs font-bold text-indigo-600 mt-2 uppercase tracking-wide">
                    Try adjusting the date filter
                  </p>
                )}
              </div>
            )}

            {/* The Client List Component */}
            <VoucherListClient
              vouchers={vouchers}
              companyId={companyId}
              baseUrl={baseUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
