import { prisma } from "@/lib/prisma";
import StockJournalForm from "@/components/forms/StockJournalForm";
import Link from "next/link";
import { ArrowLeft, ClipboardList, ChevronRight } from "lucide-react";

export default async function StockJournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const stockItems = await prisma.stockItem.findMany({
    where: { companyId },
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

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/inventory`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Inventory"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <ClipboardList size={22} className="text-indigo-600" />
                Stock Journal
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/inventory`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Inventory
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">
                  Manufacturing & Transfers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />

          <div className="p-1">
            <StockJournalForm companyId={companyId} stockItems={stockItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
