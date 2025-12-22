import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Book, Plus, ChevronRight } from "lucide-react";
import LedgerTable from "@/components/LedgerTable";

export default async function LedgerListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id);

  if (isNaN(companyId) || companyId <= 0) {
    return <div className="p-20 text-center text-red-600">Invalid ID</div>;
  }

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { group: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Workspace
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">Ledger Masters</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
              <Book className="text-white" size={24} />
            </div>
            Ledger Masters
          </h1>
          <p className="text-slate-500 mt-3 font-medium">
            Manage your Chart of Accounts and Party details.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}`}
            className="px-5 h-11 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} /> Back
          </Link>
          <Link
            href={`/companies/${companyId}/ledgers/create`}
            className="px-5 h-11 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus size={18} /> Create Ledger
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
        <LedgerTable ledgers={ledgers} companyId={companyId} />
      </div>
    </div>
  );
}
