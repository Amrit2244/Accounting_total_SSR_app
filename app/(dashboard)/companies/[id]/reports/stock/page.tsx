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
} from "lucide-react";
import InventoryTable from "@/components/InventoryTable";

export default async function InventoryListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Items with relations
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: { unit: true, group: true },
    orderBy: { name: "asc" },
  });

  // Calculate Totals
  const totalItems = items.length;

  // Calculate Total Value
  const totalValue = items.reduce((sum: any, item: any) => {
    // 1. Derive the rate
    const rate =
      item.openingQty && item.openingQty > 0
        ? item.openingValue / item.openingQty
        : 0;

    // 2. Calculate current value (Current Qty * Rate)
    const val = item.quantity * rate;

    return sum + val;
  }, 0);

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

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-8">
        {/* 1. HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Inventory</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Boxes className="text-slate-900" size={32} />
              Inventory Management
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Track stock items, monitor quantities, and manage groups or units
              of measurement efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Back Button */}
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* Config Group */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <Link
                href={`/companies/${companyId}/inventory/groups`}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
              >
                <Layers size={14} /> Groups
              </Link>
              <div className="w-px bg-slate-100 my-1 mx-1"></div>
              <Link
                href={`/companies/${companyId}/inventory/units`}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
              >
                <Scale size={14} /> Units
              </Link>
            </div>

            {/* Create Button */}
            <Link
              href={`/companies/${companyId}/inventory/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
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
          {/* Total Items Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Stock Items
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {totalItems}
                </p>
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <IndianRupee size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Valuation
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">
                  ₹
                  {totalValue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INVENTORY TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Pass data to Client Component */}
          <InventoryTable items={items} companyId={companyId} />
        </div>
      </div>
    </div>
  );
}
