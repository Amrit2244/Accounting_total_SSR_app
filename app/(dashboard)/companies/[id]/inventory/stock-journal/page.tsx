import { prisma } from "@/lib/prisma";
import StockJournalForm from "@/components/forms/StockJournalForm";

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
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          Stock Journal
        </h1>
        <p className="text-slate-500 font-medium">
          Transfer materials or record manufacturing production.
        </p>
      </div>

      <StockJournalForm companyId={companyId} stockItems={stockItems} />
    </div>
  );
}
