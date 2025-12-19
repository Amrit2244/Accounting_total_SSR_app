import { prisma } from "@/lib/prisma";
import CreateLedgerForm from "./form"; // Imports the detailed form above
import Link from "next/link";
import { BookPlus, ArrowLeft, ChevronRight } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const [company, groups] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    }),
    // ✅ FIX: Use 'prisma.group' (lowercase)
    prisma.group.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="hover:text-blue-600 transition-colors"
            >
              Ledgers
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900 tracking-tighter">New Master</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow-sm">
              <BookPlus size={18} />
            </div>
            Create Ledger
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      <p className="text-[11px] text-slate-500 font-bold mb-4 px-1">
        Setup a new account for:{" "}
        <span className="text-blue-600">{company?.name}</span>
      </p>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <CreateLedgerForm companyId={companyId} groups={groups} />
      </div>
    </div>
  );
}
