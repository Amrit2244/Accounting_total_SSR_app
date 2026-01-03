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
  ShieldCheck,
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
// VIEW 1: MONTHLY SUMMARY
// --------------------------------------------------------------------------
async function MonthlySummaryView({ companyId }: { companyId: number }) {
  const allSales = await prisma.salesVoucher.findMany({
    where: { companyId, status: "APPROVED" },
    select: { date: true, totalAmount: true },
    orderBy: { date: "desc" },
  });

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

  const monthlyData = Object.values(groupedData).sort((a: any, b: any) =>
    a.year !== b.year ? b.year - a.year : b.monthIndex - a.monthIndex
  );

  const totalSales = allSales.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6 w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 shadow-sm transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <TrendingUp size={22} className="text-indigo-600" /> Sales
                Register
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                <Link
                  href={`/companies/${companyId}`}
                  className="hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <ChevronRight size={10} />{" "}
                <span className="text-slate-900">Monthly Summary</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 text-white px-5 py-2 rounded-xl shadow-lg">
            <p className="text-[9px] font-bold uppercase opacity-70">
              Total Net Sales
            </p>
            <p className="text-lg font-bold font-mono">{fmt(totalSales)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          <div className="divide-y divide-slate-100">
            {monthlyData.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold italic">
                No approved sales found for this company.
              </div>
            ) : (
              monthlyData.map((row: any) => (
                <Link
                  key={`${row.name}-${row.year}`}
                  href={`?month=${row.monthIndex}&year=${row.year}`}
                  className="flex items-center p-5 hover:bg-slate-50 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-5 border border-indigo-100 group-hover:scale-105 transition-transform">
                    <CalendarDays size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base">
                      {row.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      {row.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 mr-4 text-right">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Vouchers
                      </p>
                      <p className="font-mono font-bold text-sm text-slate-700">
                        {row.count}
                      </p>
                    </div>
                    <div className="w-36">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Amount
                      </p>
                      <p className="font-mono font-bold text-slate-900 text-base">
                        {fmt(row.amount)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-slate-300 group-hover:text-indigo-500"
                  />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// VIEW 2: DETAILED REGISTER
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
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const vouchers = await prisma.salesVoucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    include: {
      ledgerEntries: { include: { ledger: { include: { group: true } } } },
      inventoryEntries: { include: { stockItem: true } },
      verifiedBy: { select: { role: true } },
    },
    orderBy: { date: "desc" },
  });

  let totals = { taxable: 0, tax: 0, grand: 0 };

  const registerData = vouchers.map((v: any) => {
    const isAutoVerified =
      v.verifiedBy?.role === "ADMIN" && v.createdById === v.verifiedById;
    const partyEntry = v.ledgerEntries.find((e: any) => e.amount < 0);
    const partyName = partyEntry?.ledger?.name || v.partyName || "Unknown";

    let taxable = 0,
      taxAmt = 0;
    v.ledgerEntries
      .filter((e: any) => e.amount > 0)
      .forEach((e: any) => {
        const gn = e.ledger?.group?.name?.toLowerCase() || "";
        const ln = e.ledger?.name?.toLowerCase() || "";
        if (gn.includes("tax") || gn.includes("duties") || ln.includes("gst"))
          taxAmt += e.amount;
        else taxable += e.amount;
      });

    if (taxable === 0 && taxAmt === 0) taxable = v.totalAmount;

    totals.taxable += taxable;
    totals.tax += taxAmt;
    totals.grand += taxable + taxAmt;

    return {
      id: v.id,
      date: v.date,
      vchNo: v.voucherNo,
      partyName,
      taxable,
      tax: taxAmt,
      total: taxable + taxAmt,
      isAutoVerified,
    };
  });

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 flex flex-col h-full space-y-6 flex-1 w-full">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href="?"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 shadow-sm transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {monthName}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                <span>Sales Register</span> <ChevronRight size={10} />{" "}
                <span className="text-indigo-600">
                  {registerData.length} Records
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-900 p-2 pl-6 rounded-xl border border-slate-800">
            <div className="text-right pr-4 border-r border-slate-700">
              <p className="text-[9px] font-black text-slate-500 uppercase">
                Taxable Amt
              </p>
              <p className="text-sm font-bold font-mono text-white">
                {fmt(totals.taxable)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-indigo-400 uppercase">
                Grand Total
              </p>
              <p className="text-base font-black font-mono text-white">
                {fmt(totals.grand)}
              </p>
            </div>
          </div>
        </div>

        {/* REGISTER TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="py-4 px-6 w-[120px]">Date</th>
                  <th className="py-4 px-6 w-[100px]">Vch No</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6 text-right w-[150px]">
                    Taxable Amt
                  </th>
                  <th className="py-4 px-6 text-right w-[120px]">Tax Amt</th>
                  <th className="py-4 px-6 text-right w-[160px] bg-indigo-50/50">
                    Grand Total
                  </th>
                  <th className="py-4 px-6 w-[80px] text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registerData.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-xs font-bold text-slate-600">
                      {new Date(row.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono font-bold text-slate-400">
                      #{row.vchNo}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-800">
                        {row.partyName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-600">
                      {fmt(row.taxable)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">
                      {row.tax > 0 ? fmt(row.tax) : "-"}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm font-black text-slate-900 bg-indigo-50/10 border-l border-indigo-50">
                      {fmt(row.total)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {/* ✅ FIXED: Wrapper span added to Lucide icon to prevent Title prop error */}
                      {row.isAutoVerified ? (
                        <span title="Admin Auto-Verified">
                          <ShieldCheck
                            size={14}
                            className="text-indigo-600 mx-auto"
                          />
                        </span>
                      ) : (
                        <span title="Standard Verification">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-auto" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-900 border-t border-slate-800 px-8 py-4 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
            <div className="flex gap-10">
              <span>
                Vouchers:{" "}
                <span className="text-white">{registerData.length}</span>
              </span>
              <span>
                Avg/Inv:{" "}
                <span className="text-white">
                  {fmt(totals.grand / (registerData.length || 1))}
                </span>
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Audited Financial Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
