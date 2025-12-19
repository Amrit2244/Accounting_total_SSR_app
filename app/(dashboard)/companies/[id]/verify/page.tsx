import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import VoucherTable from "@/components/VoucherTable";
import Link from "next/link";

export default async function VerificationQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch only PENDING vouchers with all required relations
  const pendingVouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "PENDING",
    },
    include: {
      entries: {
        include: {
          ledger: {
            include: { group: true },
          },
        },
      },
      inventory: { include: { stockItem: true } },
      createdBy: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shadow-sm border border-amber-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-blue-600 transition-colors"
              >
                Workspace
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Verification</span>
            </div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Approval Queue
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pendingVouchers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-md">
              <Clock size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {pendingVouchers.length} Pending
              </span>
            </div>
          )}
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all"
            title="Back to Daybook"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>

      {/* CONTENT AREA */}
      {pendingVouchers.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <VoucherTable vouchers={pendingVouchers} companyId={companyId} />
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3 shadow-sm">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Queue Cleared
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs">
            There are no pending vouchers requiring your authorization at this
            moment.
          </p>
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="mt-4 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tight"
          >
            Create New Entry →
          </Link>
        </div>
      )}
    </div>
  );
}
