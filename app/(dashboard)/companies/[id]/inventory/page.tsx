import { prisma } from "@/lib/prisma";
import Link from "next/link";
// 1. Added 'Scale' to imports
import { ArrowLeft, Package, Plus, Layers, Scale } from "lucide-react";
import InventoryTable from "@/components/InventoryTable";

export default async function InventoryListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Items
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: { unit: true, group: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Package size={24} /> STOCK ITEMS
        </h1>
        <div className="flex gap-3">
          {/* Stock Groups Button */}
          <Link
            href={`/companies/${companyId}/inventory/groups`}
            className="text-sm font-bold bg-white text-[#003366] border border-[#003366] px-4 py-2 rounded hover:bg-slate-50 flex items-center gap-2"
          >
            <Layers size={16} /> Stock Groups
          </Link>

          {/* NEW: Units Button */}
          <Link
            href={`/companies/${companyId}/inventory/units`}
            className="text-sm font-bold bg-white text-[#003366] border border-[#003366] px-4 py-2 rounded hover:bg-slate-50 flex items-center gap-2"
          >
            <Scale size={16} /> Units
          </Link>

          {/* Create Item Button (Primary) */}
          <Link
            href={`/companies/${companyId}/inventory/create`}
            className="text-sm font-bold bg-[#003366] text-white px-4 py-2 rounded hover:bg-[#002244] flex items-center gap-2"
          >
            <Plus size={16} /> Create Item
          </Link>

          {/* Back Button */}
          <Link
            href={`/companies/${companyId}`}
            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {/* NEW INTERACTIVE TABLE */}
      <InventoryTable items={items} companyId={companyId} />
    </div>
  );
}
