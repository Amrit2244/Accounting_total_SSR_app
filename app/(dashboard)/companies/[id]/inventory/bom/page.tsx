import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  Beaker,
  ChevronRight,
  ListChecks,
  Package,
  ArrowLeft,
} from "lucide-react";

export default async function BOMListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const boms = await prisma.bOM.findMany({
    where: { companyId },
    include: {
      finishedGood: { select: { name: true } },
      _count: { select: { components: true } },
    },
    orderBy: { createdAt: "desc" },
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

      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Inventory"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Beaker size={22} className="text-indigo-600" />
                Production Recipes
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
                <span className="text-slate-900">BOM Manager</span>
              </div>
            </div>
          </div>

          <Link
            href={`/companies/${companyId}/inventory/bom/create`}
            className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus
              size={16}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span>New Recipe</span>
          </Link>
        </div>

        {/* CONTENT */}
        {boms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boms.map((bom: any) => (
              <div
                key={bom.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 transition-all group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <Package size={20} />
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-indigo-100">
                      {bom._count.components} Components
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 line-clamp-1">
                    {bom.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                      Output:
                    </span>
                    <span className="font-bold text-slate-700">
                      {bom.finishedGood.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Yield Qty
                    </span>
                    <span className="text-sm font-black font-mono text-slate-900">
                      {bom.targetQty}
                    </span>
                  </div>
                  <button className="p-2 rounded-lg text-slate-300 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <ListChecks size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase mb-2">
              No Recipes Found
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mb-8">
              Create your first Bill of Materials to streamline your
              manufacturing process.
            </p>
            <Link
              href={`/companies/${companyId}/inventory/bom/create`}
              className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-800 border-b-2 border-indigo-100 hover:border-indigo-600 pb-0.5 transition-all"
            >
              Build First Recipe →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
