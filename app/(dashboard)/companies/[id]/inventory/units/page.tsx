import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Scale,
  Trash2,
  ChevronRight,
  Ruler,
} from "lucide-react";
import { revalidatePath } from "next/cache";

// Inline Server Action for deleting (keeps it simple for now)
async function deleteUnit(id: number, companyId: number) {
  "use server";
  try {
    await prisma.unit.delete({ where: { id } });
    revalidatePath(`/companies/${companyId}/inventory/units`);
  } catch (e) {
    console.error("Failed to delete unit", e);
  }
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Units
  const units = await prisma.unit.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="hover:text-blue-600 transition-colors"
            >
              Inventory
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">Units</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Scale className="text-blue-600" /> Units of Measure
          </h1>
          <p className="text-slate-500 mt-1">
            Define measurement units (e.g., kg, pcs, box) for your stock items.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/inventory`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          <Link
            href={`/companies/${companyId}/inventory/units/create`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Unit
          </Link>
        </div>
      </div>

      {/* 2. List Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-4 px-6">Unit Symbol</th>
                <th className="py-4 px-6">Formal Name</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Ruler size={32} className="text-slate-300" />
                      <p>No units found. Create one (e.g., "kg", "pcs").</p>
                    </div>
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr
                    key={unit.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-xs">
                        {unit.symbol}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {unit.name}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteUnit(unit.id, companyId);
                        }}
                      >
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
