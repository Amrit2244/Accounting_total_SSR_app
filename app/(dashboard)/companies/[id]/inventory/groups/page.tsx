import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Layers, Plus, ChevronRight } from "lucide-react";
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
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="hover:text-blue-600 transition-colors"
            >
              Inventory
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">Stock Groups</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Layers className="text-blue-600" /> Stock Groups
          </h1>
          <p className="text-slate-500 mt-1">
            Categorize your inventory (e.g., Electronics, Raw Materials) for
            better reporting.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/inventory`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          <Link
            href={`/companies/${companyId}/inventory/groups/create`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Group
          </Link>
        </div>
      </div>

      {/* 2. TABLE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <StockGroupTable groups={groups} companyId={companyId} />
      </div>
    </div>
  );
}
