import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit } from "lucide-react";
import SalesPurchaseEditForm from "@/components/forms/SalesPurchaseEditForm";

async function getVoucherForEdit(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };
  const rel = {
    ledgerEntries: { include: { ledger: true } },
    inventoryEntries: { include: { stockItem: true } },
  };

  switch (t) {
    case "SALES":
      return prisma.salesVoucher.findUnique({ where, include: rel });
    case "PURCHASE":
      return prisma.purchaseVoucher.findUnique({ where, include: rel });
    default:
      return null;
  }
}

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string; type: string; voucherId: string }>;
}) {
  const { id, type, voucherId } = await params;
  const companyId = parseInt(id);
  const vId = parseInt(voucherId);

  const voucher: any = await getVoucherForEdit(companyId, type, vId);
  if (!voucher) return notFound();

  const [ledgers, items] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      select: { id: true, name: true, group: { select: { name: true } } },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      select: { id: true, name: true, gstRate: true },
    }),
  ]);

  // ✅ FIXED: Added explicit : any to sanitization loop
  const sanitizedLedgers = ledgers.map((l: any) => ({
    ...l,
    group: l.group || { name: "Uncategorized" },
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileEdit className="text-blue-600" /> Edit {type} Voucher
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-red-600">Warning:</span> Editing
            this voucher will generate a new Transaction ID and reset approvals.
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers/${type}/${vId}`}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Cancel
        </Link>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <SalesPurchaseEditForm
          voucher={voucher}
          companyId={companyId}
          type={type.toUpperCase()}
          ledgers={sanitizedLedgers}
          items={items}
        />
      </div>
    </div>
  );
}
