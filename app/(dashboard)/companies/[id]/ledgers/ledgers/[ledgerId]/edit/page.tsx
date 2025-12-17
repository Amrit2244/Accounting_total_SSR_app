import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
// Assuming the modern form component is here:
import EditLedgerForm from "./edit-form";

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

  // 2. Fetch Groups for Dropdown (Filter by companyId is good practice)
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  if (!ledger)
    return <div className="p-10 text-red-500 font-bold">Ledger not found</div>;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* 1. Header Section (Modernized) */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {/* Breadcrumb / Context */}
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

        {/* Back Button (Modernized) */}
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* 2. Form Card (Passes data to the modern client component) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        {/*
          NOTE: The actual form logic and styling are now contained within EditLedgerForm.
          We pass the fetched data here.
        */}
        <EditLedgerForm companyId={companyId} ledger={ledger} groups={groups} />
      </div>
    </div>
  );
}
