import { getDashboardMetrics } from "@/app/actions/dashboard";
import DashboardCharts from "@/components/DashboardCharts";
import Link from "next/link";
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Landmark,
  Package,
  Book,
  MoreHorizontal,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default async function CompanyDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) return <div>Invalid Company ID</div>;

  const { cards, chart, recents } = await getDashboardMetrics(companyId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Executive Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Financial performance for FY {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> New Entry
          </Link>
        </div>
      </div>

      {/* 2. METRIC CARDS (Modern Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cash Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg">
              <Wallet size={22} />
            </div>
            {/* Decorative Trend Indicator */}
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} className="mr-1" /> +12%
            </span>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-medium text-slate-500">Cash in Hand</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {cards.totalCash.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        {/* Bank Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg">
              <Building2 size={22} />
            </div>
            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-medium text-slate-500">Bank Accounts</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {cards.totalBank.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        {/* Receivables Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-100/50 text-orange-600 rounded-lg">
              <TrendingUp size={22} />
            </div>
            <span className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
              Due
            </span>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-medium text-slate-500">Receivables</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {cards.totalDebtors.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        {/* Payables Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-rose-100/50 text-rose-600 rounded-lg">
              <TrendingDown size={22} />
            </div>
            <span className="flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              <ArrowDownRight size={12} className="mr-1" /> Pending
            </span>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-medium text-slate-500">Payables</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {cards.totalCreditors.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. MAIN CHART AREA (Span 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Cash Flow Analysis</h3>
            <select className="bg-slate-50 border-none text-xs font-medium text-slate-500 rounded-md py-1 px-2 cursor-pointer outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          {/* Passing data to chart component */}
          <DashboardCharts data={chart} />
        </div>

        {/* 4. QUICK ACTIONS & RECENT ACTIVITY (Span 1 col) */}
        <div className="space-y-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 gap-3">
            <Link
              href={`/companies/${companyId}/banking/brs`}
              className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="bg-violet-100 text-violet-600 p-3 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Landmark size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Banking Reconciliation
                </h4>
                <p className="text-xs text-slate-500">Match statements</p>
              </div>
            </Link>

            <Link
              href={`/companies/${companyId}/ledgers`}
              className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="bg-amber-100 text-amber-600 p-3 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Book size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Ledger Master
                </h4>
                <p className="text-xs text-slate-500">Manage accounts</p>
              </div>
            </Link>

            <Link
              href={`/companies/${companyId}/inventory`}
              className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="bg-cyan-100 text-cyan-600 p-3 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Inventory Manager
                </h4>
                <p className="text-xs text-slate-500">Stock & items</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recents.map((v) => (
            <div
              key={v.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    v.type === "SALES"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {v.type === "SALES" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {v.entries[0]?.ledger?.name || "Unknown Party"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-medium text-slate-400">
                      #{v.voucherNo}
                    </span>
                    <span>•</span>
                    <span>{new Date(v.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 font-mono">
                  ₹{" "}
                  {v.entries
                    .reduce(
                      (acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0),
                      0
                    )
                    .toFixed(2)}
                </p>
                <div className="flex justify-end mt-1">
                  {v.status === "APPROVED" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recents.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-3">
                <CreditCard size={24} className="text-slate-300" />
              </div>
              <p>No recent transactions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
