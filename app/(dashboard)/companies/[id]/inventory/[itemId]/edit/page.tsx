import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PackageCheck, ChevronRight } from "lucide-react";
import EditInventoryForm from "@/components/forms/EditInventoryForm";
import { notFound } from "next/navigation";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const companyId = parseInt(id);
  const iId = parseInt(itemId);

  // Fetch Data (Item + Dropdown options)
  const [item, units, groups] = await Promise.all([
    prisma.stockItem.findUnique({ where: { id: iId } }),
    prisma.unit.findMany({ where: { companyId } }),
    prisma.stockGroup.findMany({ where: { companyId } }),
  ]);

  if (!item) return notFound();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="hover:text-blue-600 transition-colors"
            >
              Inventory
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">Edit Item</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <PackageCheck className="text-white" size={24} />
            </div>
            Update Item
          </h1>
          <p className="text-slate-500 mt-3 font-medium">
            Modify details for{" "}
            <span className="text-slate-900 font-bold">{item.name}</span>
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-5 h-11 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12">
        <EditInventoryForm
          item={item}
          companyId={companyId}
          groups={groups}
          units={units}
        />
      </div>
    </div>
  );
}
