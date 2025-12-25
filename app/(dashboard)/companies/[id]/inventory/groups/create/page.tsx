import { prisma } from "@/lib/prisma";
import { ArrowLeft, Layers, ChevronRight, FolderPlus } from "lucide-react";
import Link from "next/link";
import StockGroupForm from "@/components/forms/StockGroupForm";

export default async function CreateStockGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch existing groups to populate "Parent Group" dropdown
  const existingGroups = await prisma.stockGroup.findMany({
    where: { companyId },
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

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/inventory/groups`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Groups"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <FolderPlus size={22} className="text-indigo-600" />
                New Stock Group
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/inventory`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Inventory
                </Link>
                <ChevronRight size={10} />
                <Link
                  href={`/companies/${companyId}/inventory/groups`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Groups
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">Create</span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />

          <div className="p-1">
            <StockGroupForm
              companyId={companyId}
              existingGroups={existingGroups}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
