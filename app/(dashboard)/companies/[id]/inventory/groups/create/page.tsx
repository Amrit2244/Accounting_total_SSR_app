import { prisma } from "@/lib/prisma";
import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import StockGroupForm from "@/components/forms/StockGroupForm"; // Import the client form

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
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
              <Layers size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Create Stock Group
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Define a new category to organize your inventory.
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/inventory/groups`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        <StockGroupForm companyId={companyId} existingGroups={existingGroups} />
      </div>
    </div>
  );
}
