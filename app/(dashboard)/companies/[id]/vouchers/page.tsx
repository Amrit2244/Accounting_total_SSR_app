import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Calendar, ListFilter, Search } from "lucide-react";
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

  // --- Date Logic: Default to "Latest Transaction Date" if not provided ---
  if (p.from && p.to) {
    // Case 1: User explicitly filtered dates
    startDate = new Date(p.from);
    endDate = new Date(p.to);
  } else {
    // Case 2: Auto-detect the last day with activity
    // Query all voucher tables to find the most recent date
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

    // Collect all dates found
    const allDates = [s?.date, pu?.date, pa?.date, r?.date, c?.date, j?.date]
      .filter((d): d is Date => !!d)
      .map((d) => d.getTime());

    if (allDates.length > 0) {
      // Found data: Set range to that specific single day
      const maxTimestamp = Math.max(...allDates);
      const maxDateStr = new Date(maxTimestamp).toISOString().split("T")[0];

      startDate = new Date(maxDateStr);
      endDate = new Date(maxDateStr);
      isLatestData = true;
    } else {
      // No data: Default to Today
      const todayStr = new Date().toISOString().split("T")[0];
      startDate = new Date(todayStr);
      endDate = new Date(todayStr);
    }
  }

  // Ensure end date covers the full day (23:59:59)
  endDate.setHours(23, 59, 59, 999);

  // Fetch Data
  const vouchers = await getVouchers(companyId, startDate, endDate, p.q);
  const baseUrl = `/companies/${id}/vouchers`;

  // Flag to adjust UI badge (Blue if filtered, Gray/Latest if default)
  const isFiltered = !!(p.from && p.to);

  return (
    <div className="h-screen flex flex-col bg-gray-50/50 font-sans">
      {/* --- TOP NAVIGATION / HEADER --- */}
      <div className="flex-none px-8 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Title & Context */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Daybook
              <span className="text-gray-400 font-light">/</span>
              <span className="text-gray-600">Transactions</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {/* Date Badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                <Calendar size={14} />
                <span>
                  {format(startDate, "dd MMM yyyy")}
                  {startDate.toDateString() !== endDate.toDateString() &&
                    ` — ${format(endDate, "dd MMM yyyy")}`}
                </span>
              </div>

              {/* Status Indicator */}
              {!isFiltered && (
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {isLatestData ? "(Latest Activity)" : "(Today)"}
                </span>
              )}

              {/* Count */}
              <div className="text-xs text-gray-400 font-medium px-2 border-l border-gray-300">
                {vouchers.length} Entries Found
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search & Date - Grouped for visual consistency */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <DateRangeFilter />
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <VoucherSearch />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pl-2">
              <QuickVerify companyId={companyId} />

              <Link
                href={`/companies/${companyId}/vouchers/create`}
                className="group flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-gray-900/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                <span>New Entry</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full max-w-[1920px] mx-auto flex flex-col">
          {/* Table Container */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            {/* Empty State */}
            {vouchers.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white z-20">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <Search size={32} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">
                  No transactions found for this date.
                </p>
                {!isFiltered && (
                  <p className="text-xs text-gray-400 mt-1">
                    Try changing the date filter to see other records.
                  </p>
                )}
              </div>
            )}

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
