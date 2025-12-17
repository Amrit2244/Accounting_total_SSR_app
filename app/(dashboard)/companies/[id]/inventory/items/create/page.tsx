import { prisma } from "@/lib/prisma";
import { ArrowLeft, PackagePlus } from "lucide-react";
import Link from "next/link";
import CreateItemForm from "@/components/forms/CreateItemForm"; // Use the component above

export default async function CreateItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch Units
  const units = await prisma.unit.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  // 2. Fetch Stock Groups (Required for item creation)
  const groups = await prisma.stockGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
              <PackagePlus size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Create Stock Item
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Add a new product to your inventory.
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        <CreateItemForm companyId={companyId} units={units} groups={groups} />
      </div>
    </div>
  );
}
