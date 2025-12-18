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
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  TriangleAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function CompanyDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) return <div>Invalid Company ID</div>;

  const { cards, chart, recents } = await getDashboardMetrics(companyId);

  // Fetch low stock items using the Prisma fields comparison
  const lowStockItems = await prisma.stockItem.findMany({
    where: {
      companyId,
      // Logic: quantity <= minStock
      quantity: { lte: prisma.stockItem.fields.minStock },
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. CRITICAL ALERTS SECTION (Feature 3) */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-2xl flex items-center gap-6 shadow-sm animate-pulse">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200">
            <TriangleAlert size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-900 font-black uppercase tracking-widest text-xs">
              Inventory Reorder Alert
            </h3>
            <p className="text-rose-700 text-sm font-medium mt-1">
              Critical levels reached for:{" "}
              <span className="font-bold underline">
                {lowStockItems.map((item) => item.name).join(", ")}
              </span>
              . Please replenish stock soon.
            </p>
          </div>
          <Link
            href={`/companies/${companyId}/inventory`}
            className="px-4 py-2 bg-rose-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
          >
            Manage Stock
          </Link>
        </div>
      )}

      {/* 2. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            Executive Overview
          </h1>
          <p className="text-slate-500 font-medium">
            Financial performance for FY {new Date().getFullYear()} -{" "}
            {new Date().getFullYear() + 1}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <Plus size={18} /> New Voucher
          </Link>
        </div>
      </div>

      {/* 3. METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Wallet size={20} />
            </div>
            <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              +12% <ArrowUpRight size={10} className="ml-1" />
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Cash in Hand
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            ₹
            {cards.totalCash.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Bank Balance
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            ₹
            {cards.totalBank.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Receivables
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono text-orange-600">
            ₹
            {cards.totalDebtors.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Payables
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono text-rose-600">
            ₹
            {cards.totalCreditors.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 4. MAIN CHART AREA (Feature 4: Visual Analytics) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                Revenue Analytics
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Cash Inflow vs Outflow
              </p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase rounded-lg py-2 px-3 outline-none">
              <option>FY {new Date().getFullYear()}</option>
            </select>
          </div>
          <DashboardCharts data={chart} />
        </div>

        {/* 5. QUICK ACTIONS */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] ml-4">
            Quick Access
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: "Bank Reconciliation",
                sub: "Match statements",
                icon: Landmark,
                color: "violet",
                href: "banking/brs",
              },
              {
                label: "Ledger Master",
                sub: "Manage accounts",
                icon: Book,
                color: "amber",
                href: "ledgers",
              },
              {
                label: "Inventory Manager",
                sub: "Stock levels",
                icon: Package,
                color: "cyan",
                href: "inventory",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/companies/${companyId}/${item.href}`}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all group"
              >
                <div
                  className={`bg-${item.color}-100 text-${item.color}-600 p-3 rounded-xl group-hover:bg-${item.color}-600 group-hover:text-white transition-all`}
                >
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {item.label}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    {item.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT TRANSACTIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
            Recent Activities
          </h3>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest"
          >
            View Daybook <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-slate-50">
          {recents.map((v) => (
            <div
              key={v.id}
              className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
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
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {v.entries[0]?.ledger?.name || "Unidentified Party"}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    <span className="font-mono">#{v.voucherNo}</span>
                    <span>•</span>
                    <span>{new Date(v.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 font-mono">
                  ₹
                  {v.entries
                    .reduce(
                      (acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0),
                      0
                    )
                    .toFixed(2)}
                </p>
                <div className="mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      v.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {v.status === "APPROVED" ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
