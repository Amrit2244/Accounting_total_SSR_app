import { prisma } from "@/lib/prisma";
import { getAccountingContext } from "@/lib/session";
import { redirect } from "next/navigation";
import VoucherTable from "@/components/VoucherTable";
// ... (imports remain same)

export default async function VoucherListPage() {
  // ✅ Get context from cookies
  const context = await getAccountingContext();

  // If user tries to access this without selection, middleware handles it,
  // but we add a safety check here.
  if (!context) redirect("/select-company");

  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId: context.companyId,
      date: {
        gte: context.startDate,
        lte: context.endDate,
      },
    },
    include: {
      entries: { include: { ledger: true } },
      inventory: { include: { stockItem: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header shows active FY */}
      <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
        Active Period: {context.startDate.toLocaleDateString()} to{" "}
        {context.endDate.toLocaleDateString()}
      </div>
      <VoucherTable vouchers={vouchers} companyId={context.companyId} />
    </div>
  );
}
