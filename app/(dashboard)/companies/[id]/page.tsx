import { getDashboardMetrics } from "@/app/actions/dashboard";
import DashboardCharts from "@/components/DashboardCharts";
import { getAccountingContext } from "@/lib/session";

import Link from "next/link";
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Landmark,
  Package,
  Book,
  ArrowUpRight,
  ArrowDownRight,
  TriangleAlert,
  Calendar, // Using the Lucide icon directly
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

import { redirect } from "next/navigation";

export default async function CompanyDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Get the Financial Year context
  const context = await getAccountingContext();

  // 2. Safety Check
  if (!context || context.companyId !== companyId) {
    redirect("/");
  }

  // 3. Fetch Metrics
  const { cards, chart, recents } = await getDashboardMetrics(
    companyId,
    new Date(context.startDate),
    new Date(context.endDate)
  );

  const lowStockItems = await prisma.stockItem.findMany({
    where: { companyId, quantity: { lte: prisma.stockItem.fields.minStock } },
  });

  // Color Mapping for Metrics
  const metricCards = [
    {
      label: "Cash in Hand",
      val: cards.totalCash,
      icon: Wallet,
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Bank Balance",
      val: cards.totalBank,
      icon: Building2,
      colorClass: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Receivables",
      val: cards.totalDebtors,
      icon: TrendingUp,
      colorClass: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Payables",
      val: cards.totalCreditors,
      icon: TrendingDown,
      colorClass: "text-rose-600 bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 pb-20">
      {/* --- BACKGROUND PATTERN --- */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto p-6 md:p-8">
        {/* 1. HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Calendar size={10} />
                FY: {new Date(context.startDate).getFullYear()}-
                {new Date(context.endDate).getFullYear()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Executive Overview
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Financial performance snapshot for{" "}
              {new Date(context.startDate).toLocaleDateString()} —{" "}
              {new Date(context.endDate).toLocaleDateString()}
            </p>
          </div>

          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="group inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Entry
          </Link>
        </div>

        {/* 2. ALERTS (If Any) */}
        {lowStockItems.length > 0 && (
          <div className="animate-in slide-in-from-top-2 duration-500 bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white border border-rose-100 text-rose-600 rounded-lg shadow-sm">
                <TriangleAlert size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  Inventory Alert
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Low stock detected for:{" "}
                  <span className="font-bold">
                    {lowStockItems.length} items
                  </span>
                  <span className="opacity-75 hidden sm:inline">
                    {" "}
                    (
                    {lowStockItems
                      .slice(0, 3)
                      .map((i: any) => i.name)
                      .join(", ")}
                    ...)
                  </span>
                </p>
              </div>
            </div>
            <Link
              href={`/companies/${companyId}/inventory`}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-bold uppercase rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
            >
              Resolve
            </Link>
          </div>
        )}

        {/* 3. METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {metricCards.map((c) => (
            <div
              key={c.label}
              className="group relative bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${c.colorClass}`}>
                  <c.icon size={18} />
                </div>
                {/* Decorative Pill */}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {c.label}
              </p>
              <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900">
                ₹{c.val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          ))}
        </div>

        {/* 4. MAIN DASHBOARD AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* CHART SECTION */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <BarChart3 size={20} />
                </div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                  Revenue Analytics
                </h3>
              </div>
              <div className="text-[10px] font-bold uppercase bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-slate-500">
                Current FY
              </div>
            </div>

            <div className="h-[300px] w-full">
              <DashboardCharts data={chart} />
            </div>
          </div>

          {/* SIDEBAR: Quick Actions */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60">
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-4 ml-1">
                Quick Access
              </h3>
              <div className="grid gap-3">
                {[
                  {
                    label: "Ledger Master",
                    icon: Book,
                    href: "ledgers",
                    color: "text-amber-600",
                  },
                  {
                    label: "Inventory",
                    icon: Package,
                    href: "inventory",
                    color: "text-cyan-600",
                  },
                  {
                    label: "Bank Reconciliation",
                    icon: Landmark,
                    href: "banking/brs",
                    color: "text-violet-600",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={`/companies/${companyId}/${item.href}`}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={18}
                        className={`${item.color} group-hover:scale-110 transition-transform`}
                      />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. RECENT POSTINGS TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
              Recent Postings
            </h3>
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              View Daybook
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recents.map((v: any) => (
              <div
                key={v.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      v.type === "SALES"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    {v.type === "SALES" ? (
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    ) : (
                      <ArrowDownRight size={18} strokeWidth={2.5} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                      {v.entries[0]?.ledger?.name || "Draft Entry"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        #{v.voucherNo}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {v.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black font-mono text-slate-900">
                    ₹{Math.abs(v.entries[0]?.amount || 0).toFixed(2)}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      v.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {v.status === "APPROVED" ? "Posted" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
