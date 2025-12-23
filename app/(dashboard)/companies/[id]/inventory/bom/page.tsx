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
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="bg-slate-900 p-6 rounded-2xl flex items-center justify-between text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Beaker size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">
              Production Recipes
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Manufacturing BOM Manager
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/inventory/bom/create`}
          className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase hover:bg-blue-50 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> New Recipe
        </Link>
      </div>

      {boms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ✅ FIXED: Added explicit : any type for the build to pass */}
          {boms.map((bom: any) => (
            <div
              key={bom.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Package size={18} />
                </div>
                <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  {bom._count.components} Components
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                {bom.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Output: {bom.finishedGood.name}
              </p>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                <div className="text-[9px] font-black text-slate-400 uppercase">
                  Yield: <span className="text-slate-900">{bom.targetQty}</span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-blue-600"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <ListChecks size={40} className="mx-auto text-slate-200 mb-4" />
          <h2 className="text-sm font-black text-slate-900 uppercase">
            No Production Recipes
          </h2>
          <link
            href={`/companies/${companyId}/inventory/bom/create`}
            className="text-blue-600 text-[10px] font-black uppercase mt-4 inline-block hover:underline"
          />
          Build First BOM →
        </div>
      )}
    </div>
  );
}
