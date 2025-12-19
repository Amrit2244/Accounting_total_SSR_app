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

async function deleteUnit(id: number, companyId: number) {
  "use server";
  try {
    await prisma.unit.delete({ where: { id } });
    revalidatePath(`/companies/${companyId}/inventory/units`);
  } catch (e) {
    console.error(e);
  }
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);
  const units = await prisma.unit.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase mb-1">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="hover:text-blue-600"
            >
              Inventory
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900">Units</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase">
            <Scale size={18} className="text-blue-600" /> Units of Measure
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/inventory/units/create`}
          className="px-4 py-2 bg-blue-600 text-white font-black text-[10px] uppercase rounded-lg shadow-md hover:bg-blue-700"
        >
          + Create Unit
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase border-b border-slate-200 tracking-widest">
            <tr>
              <th className="py-2.5 px-4">Symbol</th>
              <th className="py-2.5 px-4">Formal Name</th>
              <th className="py-2.5 px-4 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((unit) => (
              <tr
                key={unit.id}
                className="text-xs hover:bg-slate-50 transition-colors"
              >
                <td className="py-2 px-4 font-mono font-bold text-blue-600">
                  {unit.symbol}
                </td>
                <td className="py-2 px-4 font-bold text-slate-700">
                  {unit.name}
                </td>
                <td className="py-2 px-4 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteUnit(unit.id, companyId);
                    }}
                  >
                    <button className="p-1 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
