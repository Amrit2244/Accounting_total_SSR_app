import { prisma } from "@/lib/prisma";
import { ShieldCheck, Clock, AlertCircle } from "lucide-react";
import VoucherTable from "@/components/VoucherTable";

export default async function VerificationQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch only PENDING vouchers
  const pendingVouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "PENDING",
    },
    include: {
      entries: { include: { ledger: true } },
      inventory: { include: { stockItem: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Verification Queue
            </h1>
            <p className="text-slate-500 font-medium">
              Authorise or Reject pending transactions.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-900 rounded-2xl text-white flex items-center gap-3 shadow-xl">
          <Clock size={20} className="text-amber-400" />
          <span className="font-bold">
            {pendingVouchers.length} Awaiting Review
          </span>
        </div>
      </div>

      {pendingVouchers.length > 0 ? (
        <VoucherTable vouchers={pendingVouchers} companyId={companyId} />
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-[3rem] p-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">
            All Caught Up!
          </h2>
          <p className="text-slate-500 max-w-sm mt-2 font-medium">
            There are no pending vouchers requiring your attention at the
            moment.
          </p>
        </div>
      )}
    </div>
  );
}
