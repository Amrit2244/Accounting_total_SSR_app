import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditLedgerForm from "./edit-form"; // ✅ Import the Client Component

export default async function EditLedgerPage({
  params,
}: {
  params: Promise<{ id: string; ledgerId: string }>;
}) {
  const { id, ledgerId } = await params;
  const companyId = parseInt(id);
  const lId = parseInt(ledgerId);

  // 1. Fetch Ledger Data
  const ledger = await prisma.ledger.findUnique({ where: { id: lId } });

  // 2. Fetch Groups for Dropdown
  const groups = await prisma.accountGroup.findMany();

  if (!ledger)
    return <div className="p-10 text-red-500 font-bold">Ledger not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-300 rounded-lg mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#003366]">
          Edit Ledger: {ledger.name}
        </h1>
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* ✅ Render the Client Form */}
      <EditLedgerForm companyId={companyId} ledger={ledger} groups={groups} />
    </div>
  );
}
