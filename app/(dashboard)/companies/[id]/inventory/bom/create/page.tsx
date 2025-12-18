import { prisma } from "@/lib/prisma";
import BOMForm from "@/components/forms/BOMForm";
import { ArrowLeft, Beaker } from "lucide-react";
import Link from "next/link";

export default async function CreateBOMPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch all stock items so the user can select finished goods and raw materials
  const stockItems = await prisma.stockItem.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
      {/* Navigation & Title */}
      <div className="flex items-center justify-between">
        <Link
          href={`/companies/${companyId}/inventory/bom`}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-slate-900">
            <ArrowLeft size={16} />
          </div>
          Back to Recipes
        </Link>

        <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl">
          <Beaker size={18} />
          <span className="text-xs font-black uppercase tracking-widest">
            Recipe Builder
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
          Create New Recipe
        </h1>
        <p className="text-slate-500 font-medium">
          Define the exact components required to manufacture a finished
          product.
        </p>
      </div>

      {/* The Form Component */}
      <BOMForm companyId={companyId} stockItems={stockItems} />
    </div>
  );
}
