import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Book, Plus, ChevronRight, Contact } from "lucide-react";
import LedgerTable from "@/components/LedgerTable";

export default async function LedgerListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id);

  if (isNaN(companyId) || companyId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Invalid ID</h2>
          <p className="text-slate-500">The requested company ID is invalid.</p>
        </div>
      </div>
    );
  }

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { group: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Ledger Masters</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Contact className="text-slate-900" size={32} />
              Ledger Directory
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Manage your Chart of Accounts, parties, bank accounts, and expense
              heads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </Link>

            <Link
              href={`/companies/${companyId}/ledgers/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus
                size={16}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>Create Ledger</span>
            </Link>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Pass data to Client Component */}
          <LedgerTable ledgers={ledgers} companyId={companyId} />
        </div>
      </div>
    </div>
  );
}
