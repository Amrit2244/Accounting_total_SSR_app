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

  // ✅ FIX: Added explicit : any types for 'sum' and 'item' to pass cloud build
  // Since 'openingRate' does not exist in DB, we calculate: Rate = OpeningValue / OpeningQty
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
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">Inventory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Package className="text-blue-600" /> Inventory Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage stock items, groups, and units of measurement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Back Button */}
          <Link
            href={`/companies/${companyId}`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          {/* Config Buttons Group */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Link
              href={`/companies/${companyId}/inventory/groups`}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center gap-2"
            >
              <Layers size={14} /> Groups
            </Link>
            <div className="w-px bg-slate-300 my-1 mx-1"></div>
            <Link
              href={`/companies/${companyId}/inventory/units`}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center gap-2"
            >
              <Scale size={14} /> Units
            </Link>
          </div>

          {/* Primary Action */}
          <Link
            href={`/companies/${companyId}/inventory/create`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Item
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Items
            </p>
            <p className="text-xl font-bold text-slate-900">{totalItems}</p>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <IndianRupee size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Stock Value
            </p>
            <p className="text-xl font-bold text-slate-900">
              ₹{" "}
              {totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* 3. INVENTORY TABLE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* We pass the data to the client component to handle sorting/pagination */}
        <InventoryTable items={items} companyId={companyId} />
      </div>
    </div>
  );
}
