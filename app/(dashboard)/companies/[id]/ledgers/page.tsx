import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Book, Plus } from "lucide-react";
import LedgerTable from "@/components/LedgerTable"; // ✅ Import the new Table

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
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Book size={24} /> LEDGER MASTERS
        </h1>
        <div className="flex gap-4">
          {/* Create Button moved here for better UX, or keep it inside table */}
          <Link
            href={`/companies/${companyId}/ledgers/create`}
            className="text-sm font-bold bg-[#003366] text-white px-4 py-2 rounded shadow hover:bg-[#002244] flex items-center gap-2"
          >
            <Plus size={16} /> Create New
          </Link>
          <Link
            href={`/companies/${companyId}`}
            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {/* THE INTERACTIVE TABLE */}
      <LedgerTable ledgers={ledgers} companyId={companyId} />
    </div>
  );
}
