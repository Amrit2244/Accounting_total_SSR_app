import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LedgerEditForm from "@/components/forms/LedgerEditForm";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, PenLine } from "lucide-react";

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

  // Fetch Data
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Ledgers"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <PenLine size={22} className="text-indigo-600" />
                Update Ledger
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/ledgers`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Ledgers
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">Edit {ledger.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

          <div className="p-1">
            <LedgerEditForm
              companyId={companyId}
              ledger={ledger}
              groups={groups}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
