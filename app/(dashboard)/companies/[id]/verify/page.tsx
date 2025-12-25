import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  ListTodo,
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

  const [sales, purchase, payment, receipt, contra, journal, stock] =
    await Promise.all([
      prisma.salesVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          inventoryEntries: { include: { stockItem: true } },
          createdBy: true,
        },
      }),
      prisma.purchaseVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          inventoryEntries: { include: { stockItem: true } },
          createdBy: true,
        },
      }),
      prisma.paymentVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          createdBy: true,
        },
      }),
      prisma.receiptVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          createdBy: true,
        },
      }),
      prisma.contraVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          createdBy: true,
        },
      }),
      prisma.journalVoucher.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          ledgerEntries: { include: { ledger: { include: { group: true } } } },
          createdBy: true,
        },
      }),
      prisma.stockJournal.findMany({
        where: { companyId, status: "PENDING" },
        include: {
          inventoryEntries: { include: { stockItem: true } },
          createdBy: true,
        },
      }),
    ]);

  const pendingVouchers = [
    ...sales.map((v: any) => ({
      ...v,
      type: "SALES",
      entries: v.ledgerEntries,
      inventory: v.inventoryEntries,
    })),
    ...purchase.map((v: any) => ({
      ...v,
      type: "PURCHASE",
      entries: v.ledgerEntries,
      inventory: v.inventoryEntries,
    })),
    ...payment.map((v: any) => ({
      ...v,
      type: "PAYMENT",
      entries: v.ledgerEntries,
      inventory: [],
    })),
    ...receipt.map((v: any) => ({
      ...v,
      type: "RECEIPT",
      entries: v.ledgerEntries,
      inventory: [],
    })),
    ...contra.map((v: any) => ({
      ...v,
      type: "CONTRA",
      entries: v.ledgerEntries,
      inventory: [],
    })),
    ...journal.map((v: any) => ({
      ...v,
      type: "JOURNAL",
      entries: v.ledgerEntries,
      inventory: [],
    })),
    ...stock.map((v: any) => ({
      ...v,
      type: "STOCK_JOURNAL",
      entries: [],
      inventory: v.inventoryEntries,
    })),
  ].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Workspace
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Verification</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <ListTodo className="text-amber-500" size={32} />
              Approval Queue
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              Review and authorize pending transactions before they are posted
              to ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pendingVouchers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {pendingVouchers.length} Pending
                </span>
              </div>
            )}

            <Link
              href={`/companies/${companyId}/vouchers`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to All Vouchers"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        {pendingVouchers.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
            <VoucherTable
              vouchers={pendingVouchers as any}
              companyId={companyId}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Queue Cleared
            </h2>
            <p className="text-slate-500 font-medium text-sm max-w-sm text-center mb-8">
              Excellent! There are no pending vouchers requiring your
              authorization at this moment.
            </p>
            <Link
              href={`/companies/${companyId}/vouchers/create`}
              className="group inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-600/20"
            >
              <span>Create New Entry</span>
              <ChevronRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
