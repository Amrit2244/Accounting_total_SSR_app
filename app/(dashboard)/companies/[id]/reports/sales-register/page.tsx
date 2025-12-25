import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  TrendingUp,
  CalendarDays,
  CreditCard,
  Receipt,
} from "lucide-react";

// --- Formatters ---
const fmt = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: "INR",
  });

export default async function SalesRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const companyId = parseInt(id);
  const month = sp.month ? parseInt(sp.month) : undefined;
  const year = sp.year ? parseInt(sp.year) : undefined;

  if (month === undefined || year === undefined) {
    return <MonthlySummaryView companyId={companyId} />;
  } else {
    return (
      <VoucherRegisterView companyId={companyId} month={month} year={year} />
    );
  }
}

// --------------------------------------------------------------------------
// VIEW 1: MONTHLY SUMMARY (Dynamically generated from Data)
// --------------------------------------------------------------------------
async function MonthlySummaryView({ companyId }: { companyId: number }) {
  // 1. Fetch ALL Sales Vouchers
  const allSales = await prisma.salesVoucher.findMany({
    where: { companyId, status: "APPROVED" },
    select: {
      date: true,
      totalAmount: true,
    },
    orderBy: { date: "desc" },
  });

  // 2. Group by Month-Year
  const groupedData = allSales.reduce((acc: any, v) => {
    const d = new Date(v.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!acc[key]) {
      acc[key] = {
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        name: d.toLocaleString("default", { month: "long" }),
        count: 0,
        amount: 0,
      };
    }

    acc[key].count += 1;
    acc[key].amount += v.totalAmount || 0;
    return acc;
  }, {});

  // 3. Sort Chronologically
  const monthlyData = Object.values(groupedData).sort((a: any, b: any) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.monthIndex - a.monthIndex;
  });

  const totalSales = allSales.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

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

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Reports"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <TrendingUp size={22} className="text-indigo-600" />
                Sales Register
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                <span className="text-slate-900">Sales Summary</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white px-5 py-2 rounded-xl shadow-lg shadow-slate-900/10">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">
              Grand Total Sales
            </p>
            <p className="text-lg font-bold font-mono">{fmt(totalSales)}</p>
          </div>
        </div>

        {/* CONTENT CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Filter className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No Sales Found
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                There are no approved sales vouchers in the database.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthlyData.map((row: any) => (
                <Link
                  key={`${row.name}-${row.year}`}
                  href={`?month=${row.monthIndex}&year=${row.year}`}
                  className="flex items-center p-5 hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-5 border border-indigo-100 group-hover:scale-105 transition-transform">
                    <CalendarDays size={24} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {row.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      {row.year}
                    </p>
                  </div>

                  <div className="flex items-center gap-8 mr-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Vouchers
                      </p>
                      <p className="font-mono font-bold text-slate-700 text-sm">
                        {row.count}
                      </p>
                    </div>
                    <div className="text-right w-36">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Amount
                      </p>
                      <p className="font-mono font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {fmt(row.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="pl-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// VIEW 2: DETAILED VOUCHER REGISTER
// --------------------------------------------------------------------------
async function VoucherRegisterView({
  companyId,
  month,
  year,
}: {
  companyId: number;
  month: number;
  year: number;
}) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  const vouchers = await prisma.salesVoucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    include: {
      ledgerEntries: {
        include: {
          ledger: {
            include: { group: true },
          },
        },
      },
      inventoryEntries: {
        include: { stockItem: true },
      },
    },
    orderBy: { date: "desc" },
  });

  let totalTaxable = 0;
  let totalTax = 0;
  let totalGrand = 0;

  const registerData = vouchers.map((v: any) => {
    // 1. Identify Party (Debit Side / Negative in DB)
    const partyEntry = v.ledgerEntries.find((e: any) => e.amount < 0);
    const partyName =
      partyEntry?.ledger?.name || v.partyName || "Cash / Unknown";

    // 2. Calculate Split (Taxable vs Tax) from Credit Side
    let taxable = 0;
    let taxAmt = 0;

    v.ledgerEntries
      .filter((e: any) => e.amount > 0)
      .forEach((e: any) => {
        const amt = e.amount;
        const grpName = e.ledger?.group?.name?.toLowerCase() || "";
        const ledName = e.ledger?.name?.toLowerCase() || "";

        if (
          grpName.includes("duties") ||
          grpName.includes("tax") ||
          ledName.includes("gst") ||
          ledName.includes("tax") ||
          ledName.includes("duty")
        ) {
          taxAmt += amt;
        } else {
          taxable += amt;
        }
      });

    if (taxable === 0 && taxAmt === 0) {
      taxable = v.totalAmount;
    }

    const voucherTotal = taxable + taxAmt;

    totalTaxable += taxable;
    totalTax += taxAmt;
    totalGrand += voucherTotal;

    return {
      id: v.id,
      date: v.date,
      voucherNo: v.voucherNo,
      partyName,
      items: v.inventoryEntries,
      taxable,
      tax: taxAmt,
      total: voucherTotal,
    };
  });

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href="?"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Summary"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileText size={22} className="text-indigo-600" />
                {monthName}
              </h1>

              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/reports/sales-register`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Sales Register
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">
                  {registerData.length} Vouchers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="px-3 border-r border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Taxable
              </p>
              <p className="text-sm font-bold font-mono text-slate-700">
                {fmt(totalTaxable)}
              </p>
            </div>
            <div className="px-3 border-r border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Tax
              </p>
              <p className="text-sm font-bold font-mono text-slate-700">
                {fmt(totalTax)}
              </p>
            </div>
            <div className="px-3">
              <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                Total Sales
              </p>
              <p className="text-base font-black font-mono text-indigo-700">
                {fmt(totalGrand)}
              </p>
            </div>
          </div>
        </div>

        {/* REGISTER TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-6 w-[120px]">Date</th>
                  <th className="py-3 px-6 w-[100px]">Vch No</th>
                  <th className="py-3 px-6">Party Name</th>
                  <th className="py-3 px-6">Items</th>
                  <th className="py-3 px-6 text-right w-[140px]">Taxable</th>
                  <th className="py-3 px-6 text-right w-[120px]">Tax</th>
                  <th className="py-3 px-6 text-right w-[160px] bg-slate-100 text-slate-800">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registerData.map((row: any) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-6 text-xs font-bold text-slate-600 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="py-3 px-6 text-xs font-mono font-bold text-slate-500">
                      #{row.voucherNo}
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        {row.partyName}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      {row.items.length > 0 ? (
                        <div className="space-y-1">
                          {row.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-[11px]"
                            >
                              <span className="text-slate-600 font-medium truncate max-w-[200px]">
                                {item.stockItem?.name}
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {Math.abs(item.quantity)} x {item.rate}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded">
                          Account Invoice
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-xs font-medium text-slate-600">
                      {fmt(row.taxable)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-xs font-medium text-slate-500">
                      {row.tax > 0 ? (
                        fmt(row.tax)
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-xs font-bold text-slate-900 bg-slate-50/50 group-hover:bg-indigo-50/20 border-l border-slate-100">
                      {fmt(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            <div className="flex gap-6">
              <span>
                Vouchers:{" "}
                <span className="text-white">{registerData.length}</span>
              </span>
            </div>
            <div className="flex gap-8 items-center">
              <div>
                Taxable:{" "}
                <span className="text-white font-mono ml-2">
                  {fmt(totalTaxable)}
                </span>
              </div>
              <div>
                Tax:{" "}
                <span className="text-white font-mono ml-2">
                  {fmt(totalTax)}
                </span>
              </div>
              <div className="bg-indigo-600 text-white px-3 py-1 rounded ml-2">
                Total: <span className="font-mono ml-1">{fmt(totalGrand)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
