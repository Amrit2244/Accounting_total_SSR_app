import Link from "next/link";
import { Plus, Calendar, List } from "lucide-react";
import { format } from "date-fns";
import { getVouchers } from "@/app/actions/voucher";
import QuickVerify from "@/components/QuickVerify";
import DateRangeFilter from "@/components/DateRangeFilter";
import VoucherSearch from "@/components/VoucherSearch";
// ✅ IMPORT THE NEW CLIENT COMPONENT
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

  let startDate: Date | undefined = p.from ? new Date(p.from) : undefined;
  let endDate: Date | undefined = p.to ? new Date(p.to) : undefined;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  // Fetch Data
  const vouchers = await getVouchers(companyId, startDate, endDate, p.q);
  const baseUrl = `/companies/${id}/vouchers`;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col space-y-4 p-4 font-sans overflow-hidden">
      {/* HEADER SECTION */}
      <div className="shrink-0 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Daybook / Transactions
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {startDate && endDate ? (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">
                  <Calendar size={12} />
                  Filtered Period: {format(startDate, "dd MMM yyyy")} —{" "}
                  {format(endDate, "dd MMM yyyy")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-wider">
                  <List size={12} />
                  Showing All Transactions
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <QuickVerify companyId={companyId} />
            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
            <Link
              href={`/companies/${companyId}/vouchers/create`}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Plus size={16} /> New Entry
            </Link>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row gap-3">
          <DateRangeFilter />
          <VoucherSearch />
        </div>
      </div>

      {/* ✅ REPLACED RAW TABLE WITH CLIENT COMPONENT */}
      <VoucherListClient
        vouchers={vouchers}
        companyId={companyId}
        baseUrl={baseUrl}
      />
    </div>
  );
}
