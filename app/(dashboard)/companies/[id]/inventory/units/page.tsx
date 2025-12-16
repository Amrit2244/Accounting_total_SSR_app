import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus, Scale, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

// Simple Server Action to delete (Inline for simplicity, or move to actions file)
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
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/companies/${companyId}/inventory`}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6" />
            Units of Measure
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/inventory/units/create`}
          className="bg-[#003366] text-white px-4 py-2 rounded hover:bg-[#002244] flex items-center gap-2 text-sm font-bold"
        >
          <Plus size={16} /> Create Unit
        </Link>
      </div>

      {/* List */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="py-3 px-4">Unit Symbol</th>
              <th className="py-3 px-4">Formal Name</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {units.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No units found. Create one (e.g., "kg", "pcs").
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{unit.symbol}</td>
                  <td className="py-3 px-4 text-gray-600">{unit.name}</td>
                  <td className="py-3 px-4 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteUnit(unit.id, companyId);
                      }}
                    >
                      <button className="text-red-500 hover:text-red-700">
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
  );
}
