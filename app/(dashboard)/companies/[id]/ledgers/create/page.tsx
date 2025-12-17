import { prisma } from "@/lib/prisma";
import CreateLedgerForm from "./form";
import Link from "next/link";
import { BookPlus, ArrowLeft, ChevronRight } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Company Name
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  // Fetch All Groups (matching the 'group' model in schema)
  const groups = await prisma.group.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* MODERN HEADER */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="hover:text-blue-600 transition-colors"
            >
              Ledger Masters
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">New Account</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <BookPlus className="text-white" size={24} />
            </div>
            Create Ledger
          </h1>
          <p className="text-slate-500 mt-3 font-medium">
            Setup a new account for{" "}
            <span className="text-slate-900 font-bold">{company?.name}</span>
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/ledgers`}
          className="px-5 h-11 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12">
        <CreateLedgerForm companyId={companyId} groups={groups} />
      </div>
    </div>
  );
}
