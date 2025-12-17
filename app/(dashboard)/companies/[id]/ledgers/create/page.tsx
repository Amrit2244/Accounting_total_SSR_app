import { prisma } from "@/lib/prisma";
import CreateLedgerForm from "./form";
import Link from "next/link";
import { BookOpen, ArrowLeft, ChevronRight } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Company Name for display
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  // Fetch All Groups (to show in dropdown)
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* HEADER */}
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
            <span className="text-slate-900 font-medium">Create</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Create Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Adding a new account head for {company?.name}.
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/ledgers`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        <CreateLedgerForm companyId={companyId} groups={groups} />
      </div>
    </div>
  );
}
