import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PackagePlus, ChevronRight } from "lucide-react";
import CreateItemForm from "@/components/forms/CreateItemForm";

export default async function CreateItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const [units, groups] = await Promise.all([
    prisma.unit.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.stockGroup.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-xl mx-auto space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2">
          <PackagePlus size={20} className="text-blue-600" /> New Stock Item
        </h1>
        <Link
          href={`/companies/${companyId}/inventory`}
          className="text-[10px] font-black text-slate-400 uppercase"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <CreateItemForm companyId={companyId} units={units} groups={groups} />
      </div>
    </div>
  );
}
