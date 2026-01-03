import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Plus,
  Layers,
  Scale,
  ChevronRight,
  IndianRupee,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import InventoryTable from "@/components/InventoryTable";

export default async function InventoryListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Filter strictly for APPROVED vouchers (Standard or Admin Auto-Verified)
  const voucherFilter = { status: "APPROVED" };

  // Fetch Items with relations and their transaction history
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: {
      unit: true,
      group: true,
      salesItems: {
        where: { salesVoucher: voucherFilter },
        select: { quantity: true, amount: true },
      },
      purchaseItems: {
        where: { purchaseVoucher: voucherFilter },
        select: { quantity: true, amount: true },
      },
      journalEntries: {
        where: { stockJournal: voucherFilter },
        select: { quantity: true, amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate Totals using Weighted Average Logic
  let totalValue = 0;
  const processedItems = items.map((item: any) => {
    const opQty = item.openingQty || 0;
    const opVal = Math.abs(item.openingValue || 0);

    const allEntries = [
      ...item.salesItems.map((e: any) => ({ qty: e.quantity, val: e.amount })),
      ...item.purchaseItems.map((e: any) => ({
        qty: e.quantity,
        val: e.amount,
      })),
      ...item.journalEntries.map((e: any) => ({
        qty: e.quantity,
        val: e.amount,
      })),
    ];

    let currentQty = opQty;
    let totalInwardQty = opQty;
    let totalInwardVal = opVal;

    allEntries.forEach((e: any) => {
      currentQty += e.qty;
      if (e.qty > 0) {
        // Purchase/Inward
        totalInwardQty += e.qty;
        totalInwardVal += Math.abs(e.val);
      }
    });

    const avgRate = totalInwardQty > 0 ? totalInwardVal / totalInwardQty : 0;
    const stockVal = Math.max(0, currentQty * avgRate);
    totalValue += stockVal;

    return {
      ...item,
      quantity: currentQty,
      valuation: stockVal,
      avgRate: avgRate,
    };
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-8">
        {/* 1. HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Workspace
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Inventory Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Boxes className="text-indigo-600" size={32} />
              Stock Summary
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl mr-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-700">
                Verified Valuation
              </span>
            </div>
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <Link
                href={`/companies/${companyId}/inventory/groups`}
                className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
              >
                <Layers size={14} /> Groups
              </Link>
              <Link
                href={`/companies/${companyId}/inventory/units`}
                className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
              >
                <Scale size={14} /> Units
              </Link>
            </div>

            <Link
              href={`/companies/${companyId}/inventory/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-600/20"
            >
              <Plus
                size={16}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>Create Item</span>
            </Link>
          </div>
        </div>

        {/* 2. STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Stock Items"
            value={processedItems.length}
            icon={<Package size={24} />}
            color="blue"
          />
          <StatCard
            label="Total Valuation"
            value={`₹ ${totalValue.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`}
            icon={<IndianRupee size={24} />}
            color="emerald"
            isMono
          />
        </div>

        {/* 3. INVENTORY TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          <InventoryTable items={processedItems} companyId={companyId} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, isMono }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-xl transition-colors group-hover:text-white ${colors[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </p>
          <p
            className={`text-2xl font-black text-slate-900 mt-0.5 ${
              isMono ? "font-mono" : ""
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
