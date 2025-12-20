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
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAccountingContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CompanyDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Get the Financial Year context from cookies
  const context = await getAccountingContext();

  // 2. Safety Check: If no context or ID mismatch, redirect to selection
  if (!context || context.companyId !== companyId) {
    redirect("/");
  }

  // 3. Fetch Metrics filtered by the selected FY dates
  const { cards, chart, recents } = await getDashboardMetrics(
    companyId,
    new Date(context.startDate),
    new Date(context.endDate)
  );

  const lowStockItems = await prisma.stockItem.findMany({
    where: { companyId, quantity: { lte: prisma.stockItem.fields.minStock } },
  });

  // Color Mapping to fix Tailwind dynamic class compilation issues
  const metricCards = [
    {
      label: "Cash in Hand",
      val: cards.totalCash,
      icon: Wallet,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      hover: "group-hover:bg-emerald-600",
    },
    {
      label: "Bank Balance",
      val: cards.totalBank,
      icon: Building2,
      bg: "bg-blue-50",
      text: "text-blue-600",
      hover: "group-hover:bg-blue-600",
    },
    {
      label: "Receivables",
      val: cards.totalDebtors,
      icon: TrendingUp,
      bg: "bg-orange-50",
      text: "text-orange-600",
      hover: "group-hover:bg-orange-600",
    },
    {
      label: "Payables",
      val: cards.totalCreditors,
      icon: TrendingDown,
      bg: "bg-rose-50",
      text: "text-rose-600",
      hover: "group-hover:bg-rose-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. FINANCIAL YEAR BADGE */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
          <Calendar size={12} />
          FY: {context.startDate.getFullYear()} -{" "}
          {context.endDate.getFullYear()}
        </div>
      </div>

      {/* 2. COMPACT REORDER ALERT */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg shadow-sm">
              <TriangleAlert size={18} />
            </div>
            <p className="text-rose-900 text-xs font-bold uppercase tracking-tight">
              Low Stock Alert:{" "}
              <span className="underline decoration-rose-300 font-black">
                {lowStockItems.map((i) => i.name).join(", ")}
              </span>
            </p>
          </div>
          <Link
            href={`/companies/${companyId}/inventory`}
            className="px-3 py-1.5 bg-rose-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition-colors"
          >
            Manage Stock
          </Link>
        </div>
      )}

      {/* 3. COMPACT HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            Executive Overview
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Period: {context.startDate.toLocaleDateString()} —{" "}
            {context.endDate.toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers/create`}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-200"
        >
          <Plus size={14} /> New Entry
        </Link>
      </div>

      {/* 4. METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((c) => (
          <div
            key={c.label}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 ${c.bg} ${c.text} rounded-lg ${c.hover} group-hover:text-white transition-colors`}
              >
                <c.icon size={16} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {c.label}
              </p>
            </div>
            <h3
              className={`text-lg font-black font-mono tracking-tighter text-slate-900`}
            >
              ₹{c.val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        ))}
      </div>

      {/* 5. ANALYTICS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
              Revenue Analytics
            </h3>
            <div className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">
              Selected FY
            </div>
          </div>
          <div className="h-[240px]">
            <DashboardCharts data={chart} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-2">
            Quick Access
          </h3>
          <div className="grid gap-2">
            {[
              {
                label: "Ledger Master",
                icon: Book,
                bg: "bg-amber-50",
                text: "text-amber-600",
                hover: "hover:bg-amber-600",
                href: "ledgers",
              },
              {
                label: "Inventory Manager",
                icon: Package,
                bg: "bg-cyan-50",
                text: "text-cyan-600",
                hover: "hover:bg-cyan-600",
                href: "inventory",
              },
              {
                label: "Bank Reco",
                icon: Landmark,
                bg: "bg-violet-50",
                text: "text-violet-600",
                hover: "hover:bg-violet-600",
                href: "banking/brs",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/companies/${companyId}/${item.href}`}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all group"
              >
                <div
                  className={`p-2 ${item.bg} ${item.text} rounded-lg group-hover:${item.hover} group-hover:text-white transition-all`}
                >
                  <item.icon size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT ACTIVITIES TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center font-black uppercase tracking-widest text-[10px]">
          <span>Recent Postings (FY Only)</span>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-blue-600 hover:underline"
          >
            View Daybook
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recents.map((v) => (
            <div
              key={v.id}
              className="px-6 py-3 flex items-center justify-between hover:bg-blue-50/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    v.type === "SALES"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {v.type === "SALES" ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {v.entries[0]?.ledger?.name || "Draft Entry"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                    #{v.voucherNo} • {v.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black font-mono">
                  ₹{Math.abs(v.entries[0]?.amount || 0).toFixed(2)}
                </p>
                <span
                  className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
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
  );
}

// Simple Calendar icon for the badge
function Calendar({ size }: { size: number }) {
  return <Book size={size} />;
}
