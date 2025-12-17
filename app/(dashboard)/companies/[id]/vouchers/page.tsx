import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, ChevronRight, Clock } from "lucide-react";
import TransactionSearch from "@/components/TransactionSearch";
import VoucherTable from "@/components/VoucherTable";

export default async function VoucherListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch vouchers with ALL required relations
  const vouchers = await prisma.voucher.findMany({
    where: { companyId },
    include: {
      entries: {
        include: { ledger: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const pendingCount = vouchers.filter((v) => v.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">Daybook</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <FileText className="text-blue-600" size={32} /> Daybook Journal
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 text-sm">
              Reviewing {vouchers.length} total entries.
            </p>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold border border-red-200 animate-pulse">
                <Clock size={12} /> {pendingCount} Pending Verification
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <TransactionSearch companyId={companyId} />
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={18} /> New Voucher
          </Link>
        </div>
      </div>

      {/* 2. Passing vouchers and companyId to the client table */}
      <VoucherTable vouchers={vouchers} companyId={companyId} />
    </div>
  );
}
