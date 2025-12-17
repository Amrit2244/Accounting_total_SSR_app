import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
// FIX: Changed import from VoucherEditForm to the correct LedgerEditForm
import LedgerEditForm from "@/components/forms/LedgerEditForm";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

// Define the exact Params type expected from the URL segments
type EditLedgerParams = {
  id: string; // Corresponds to [id] (companyId)
  ledgerId: string; // Corresponds to [ledgerId]
};

export default async function EditLedgerPage({
  params,
}: {
  params: EditLedgerParams;
}) {
  const { id, ledgerId } = params;

  // --- CRITICAL FIX: Robust Parameter Validation ---
  const companyId = parseInt(id);
  const lId = parseInt(ledgerId);

  if (isNaN(companyId) || companyId <= 0 || isNaN(lId) || lId <= 0) {
    notFound();
  }
  // --- END CRITICAL FIX ---

  // 1. Fetch Ledger Data
  const ledger = await prisma.ledger.findUnique({
    where: { id: lId, companyId },
  }); // Adding companyId to where clause for security

  // 2. Fetch Groups for Dropdown
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  // --- CRITICAL DATA CHECK ---
  if (!ledger) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="hover:text-blue-600 transition-colors"
            >
              Ledger Masters
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">Edit</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Edit Ledger: <span className="text-blue-700">{ledger.name}</span>
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        <LedgerEditForm companyId={companyId} ledger={ledger} groups={groups} />
      </div>
    </div>
  );
}
