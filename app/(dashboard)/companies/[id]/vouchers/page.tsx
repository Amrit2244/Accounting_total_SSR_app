import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import TransactionSearch from "@/components/TransactionSearch";
import VoucherTable from "@/components/VoucherTable";

export default async function VoucherListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // FIXED: Kept the correct query that filters by Company ID and includes details
  const vouchers = await prisma.voucher.findMany({
    where: { companyId },
    include: {
      entries: {
        include: { ledger: true }, // To get Ledger Names
      },
      inventory: true, // To get Stock Items
      createdBy: true,
    },
    orderBy: { date: "desc" },
  });

  // REMOVED: Duplicate 'const vouchers' declaration
  // REMOVED: Premature 'return <VoucherList...>'

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
        <div>
          <h1 className="text-lg font-bold text-[#003366] flex items-center gap-2">
            <FileText size={20} /> DAYBOOK
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Review and verify entries
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              Verify Transaction
            </label>
            <TransactionSearch companyId={companyId} />
          </div>
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="bg-[#004b8d] hover:bg-[#003366] text-white px-4 py-2 text-xs font-bold rounded shadow-sm flex items-center gap-2 h-10"
          >
            <Plus size={16} /> NEW ENTRY
          </Link>
        </div>
      </div>

      {/* TABLE */}
      {/* Passing the fetched data to the Client Component */}
      <VoucherTable vouchers={vouchers} companyId={companyId} />
    </div>
  );
}
