import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Plus,
  ChevronRight,
  FolderTree,
} from "lucide-react";
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}/inventory`}
                className="hover:text-indigo-600 transition-colors"
              >
                Inventory
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Configuration</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <FolderTree className="text-slate-900" size={32} />
              Stock Groups
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Organize your inventory into hierarchical categories (e.g.,
              Electronics, Raw Materials) to generate granular reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Inventory"
            >
              <ArrowLeft size={20} />
            </Link>

            <Link
              href={`/companies/${companyId}/inventory/groups/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus
                size={16}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>Create Group</span>
            </Link>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Pass data to Client Component */}
          <StockGroupTable groups={groups} companyId={companyId} />
        </div>
      </div>
    </div>
  );
}
