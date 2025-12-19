import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoucherEditForm from "@/components/forms/VoucherEditForm";
import Link from "next/link";
import { ArrowLeft, FileEdit, ChevronRight } from "lucide-react";

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string; voucherId: string }>;
}) {
  const { id, voucherId } = await params;

  const companyId = parseInt(id);
  const vId = parseInt(voucherId);

  if (isNaN(companyId) || isNaN(vId)) return notFound();

  // 1. Fetch Voucher with FULL relations
  const voucher = await prisma.voucher.findUnique({
    where: { id: vId, companyId: companyId },
    include: {
      entries: {
        include: { ledger: true },
        orderBy: { amount: "desc" }, // Put larger amounts (usually Party/Sales) first
      },
      inventory: {
        include: { stockItem: true },
      },
    },
  });

  if (!voucher) return notFound();

  // 2. Fetch Masters for dropdowns
  const [ledgers, stockItems] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-[1400px] mx-auto py-4 px-4 space-y-4 animate-in fade-in duration-500">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="hover:text-blue-600 transition-colors"
            >
              Daybook
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900">Modify Entry</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow-sm">
              <FileEdit size={16} />
            </div>
            Edit {voucher.type}:{" "}
            <span className="font-mono text-blue-700">
              #{voucher.voucherNo}
            </span>
          </h1>
        </div>

        <Link
          href={`/companies/${companyId}/vouchers`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Cancel Editing"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6">
        <VoucherEditForm
          voucher={voucher}
          companyId={companyId}
          ledgers={ledgers}
          stockItems={stockItems}
        />
      </div>
    </div>
  );
}
