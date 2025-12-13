import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Book, Plus, Edit } from "lucide-react"; // Added Edit Icon
import DeleteButton from "@/components/DeleteButton";
import { deleteLedger } from "@/app/actions/masters"; // Ensure this matches your file name (master.ts vs masters.ts)

export default async function LedgerListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { group: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Book size={24} /> LEDGER MASTERS
        </h1>
        <Link
          href={`/companies/${companyId}`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600 uppercase">
            Account List
          </span>
          <Link
            href={`/companies/${companyId}/ledgers/create`}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Create New Ledger
          </Link>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#003366] text-white text-xs uppercase font-bold">
            <tr>
              <th className="p-3 pl-6">Ledger Name</th>
              <th className="p-3">Under Group</th>
              <th className="p-3 text-right">Op Balance</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ledgers.map((l) => (
              <tr key={l.id} className="hover:bg-blue-50">
                <td className="p-3 pl-6 font-bold text-gray-800">{l.name}</td>
                <td className="p-3 text-gray-600">{l.group.name}</td>
                <td className="p-3 text-right font-mono">
                  {l.openingBalance.toFixed(2)}
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  {/* ✅ EDIT BUTTON */}
                  <Link
                    href={`/companies/${companyId}/ledgers/${l.id}/edit`}
                    className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </Link>

                  {/* ✅ DELETE BUTTON */}
                  <DeleteButton
                    id={l.id}
                    companyId={companyId}
                    action={deleteLedger}
                  />
                </td>
              </tr>
            ))}
            {ledgers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No ledgers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
