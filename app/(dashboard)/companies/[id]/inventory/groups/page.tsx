import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Layers, Plus } from "lucide-react";
import StockGroupTable from "@/components/StockGroupTable";

export default async function StockGroupListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Groups (Self-referencing include to get Parent Name)
  const groups = await prisma.stockGroup.findMany({
    where: { companyId },
    include: { parent: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Layers size={24} /> STOCK GROUPS
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/inventory/groups/create`}
            className="text-sm font-bold bg-[#003366] text-white px-4 py-2 rounded hover:bg-[#002244] flex items-center gap-2"
          >
            <Plus size={16} /> Create Group
          </Link>

          <Link
            href={`/companies/${companyId}/inventory`}
            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <StockGroupTable groups={groups} companyId={companyId} />
    </div>
  );
}
