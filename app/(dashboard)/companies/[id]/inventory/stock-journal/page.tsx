import { prisma } from "@/lib/prisma";
import StockJournalForm from "@/components/forms/StockJournalForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            Stock Journal
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Manufacturing & Transfers
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/inventory`}
          className="text-[10px] font-black text-slate-400 hover:text-slate-900 flex items-center gap-1 uppercase"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      {/* High-density Form Component */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <StockJournalForm companyId={companyId} stockItems={stockItems} />
      </div>
    </div>
  );
}
