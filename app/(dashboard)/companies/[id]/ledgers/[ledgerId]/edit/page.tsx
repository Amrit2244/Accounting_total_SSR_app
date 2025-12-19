import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LedgerEditForm from "@/components/forms/LedgerEditForm";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

export default async function EditLedgerPage({
  params,
}: {
  params: Promise<{ id: string; ledgerId: string }>;
}) {
  // ✅ Next.js 15 requires awaiting the params promise
  const { id, ledgerId } = await params;

  const companyId = parseInt(id);
  const lId = parseInt(ledgerId);

  // Validation: If IDs aren't numbers, return 404
  if (isNaN(companyId) || isNaN(lId)) {
    return notFound();
  }

  // Fetch Data (Using your 'group' model name from earlier fix)
  const [ledger, groups] = await Promise.all([
    prisma.ledger.findUnique({
      where: { id: lId, companyId },
    }),
    prisma.group.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ledger) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-500">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="hover:text-blue-600 transition-colors uppercase"
            >
              Ledgers
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900 uppercase">Update Account</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <BookOpen size={18} className="text-blue-600" />
            Edit: <span className="text-blue-700">{ledger.name}</span>
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <LedgerEditForm companyId={companyId} ledger={ledger} groups={groups} />
      </div>
    </div>
  );
}
