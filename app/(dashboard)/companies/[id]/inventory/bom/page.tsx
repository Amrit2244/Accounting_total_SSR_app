import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Beaker, ChevronRight, ListChecks, Package } from "lucide-react";

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
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
            <Beaker size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Production Recipes
            </h1>
            <p className="text-slate-500 font-medium italic">
              Define Bill of Materials (BOM) for manufacturing.
            </p>
          </div>
        </div>

        <Link
          href={`/companies/${companyId}/inventory/bom/create`}
          className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} /> New Recipe
        </Link>
      </div>

      {/* Recipe Cards Grid */}
      {boms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boms.map((bom) => (
            <div
              key={bom.id}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Package size={24} />
                </div>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  {bom._count.components} Ingredients
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">
                {bom.name}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase mb-4">
                Produces: {bom.finishedGood.name}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Base Qty:{" "}
                  <span className="text-slate-900">{bom.targetQty}</span>
                </div>
                <button className="text-blue-600 hover:translate-x-1 transition-transform">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
            <ListChecks size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">
            No Recipes Found
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">
            Start by creating a recipe to automate your manufacturing stock
            journals.
          </p>
        </div>
      )}
    </div>
  );
}
