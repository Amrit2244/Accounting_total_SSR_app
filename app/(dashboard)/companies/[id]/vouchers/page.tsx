import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ArrowLeft, CreditCard, ListFilter } from "lucide-react";
import { format } from "date-fns";
import { getVouchers } from "@/app/actions/voucher";
import QuickVerify from "@/components/QuickVerify";
// ✅ IMPORT THE NEW COMPONENT
import TallyDateRangeFilter from "@/components/TallyDateRangeFilter";
import VoucherSearch from "@/components/VoucherSearch";
import VoucherListClient from "@/components/VoucherListClient";
import VoucherTypeFilter from "@/components/VoucherTypeFilter";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

async function getUserRole(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return "USER";
    const { payload } = await jwtVerify(session, encodedKey);
    return (payload.role as string) || "USER";
  } catch {
    return "USER";
  }
}

export default async function VoucherListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    q?: string;
    type?: string;
  }>;
}) {
  const { id } = await params;
  const p = await searchParams;
  const companyId = parseInt(id);
  const userRole = await getUserRole();
  const isAdmin = userRole === "ADMIN";

  let startDate: Date;
  let endDate: Date;
  let isLatestData = false;

  // --- Date Logic ---
  if (p.from && p.to) {
    // A. User selected a specific range
    startDate = new Date(p.from);
    endDate = new Date(p.to);
  } else {
    // B. No filter: Find the LATEST transaction date in the DB
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

  let vouchers = await getVouchers(companyId, startDate, endDate, p.q);
  const filterType = p.type?.toUpperCase() || "ALL";

  if (filterType !== "ALL") {
    vouchers = vouchers.filter(
      (v: any) => v.type?.toUpperCase() === filterType
    );
  }

  const baseUrl = `/companies/${id}/vouchers`;
  const totalDebit = vouchers.reduce(
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

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${id}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <CreditCard size={16} className="text-indigo-600" />
                Daybook
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <span>{format(startDate, "dd MMM yyyy")}</span>
                {isLatestData && (
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
                    Latest
                  </span>
                )}
                <span>•</span>
                <span>{vouchers.length} Entries</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg">
              {/* ✅ UPDATED FILTER COMPONENT */}
              <TallyDateRangeFilter />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <VoucherTypeFilter />
            </div>

            <VoucherSearch />
            <QuickVerify companyId={companyId} />

            <Link
              href={`/companies/${companyId}/vouchers/create`}
              className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
            >
              <Plus size={12} /> New
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 p-2 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col relative overflow-hidden">
          {vouchers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <ListFilter className="text-slate-300" size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                No Vouchers Found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try changing the date range or search query.
              </p>
            </div>
          ) : (
            <VoucherListClient
              vouchers={vouchers}
              companyId={companyId}
              baseUrl={baseUrl}
              isAdmin={isAdmin}
              // @ts-ignore
              dayTotal={totalDebit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
