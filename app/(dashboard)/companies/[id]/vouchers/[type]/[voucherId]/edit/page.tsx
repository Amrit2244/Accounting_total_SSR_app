import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit } from "lucide-react";
import SalesPurchaseEditForm from "@/components/forms/SalesPurchaseEditForm";

// Helper to fetch the correct voucher based on type
async function getVoucherForEdit(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };

  // Relations to include for the form
  const rel = {
    ledgerEntries: { include: { ledger: true } },
    inventoryEntries: { include: { stockItem: true } },
  };

  switch (t) {
    case "SALES":
      return prisma.salesVoucher.findUnique({ where, include: rel });
    case "PURCHASE":
      return prisma.purchaseVoucher.findUnique({ where, include: rel });
    // Add other cases if you expand editing to Payment/Receipt later
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

  // 1. Fetch Voucher Data
  const voucher: any = await getVoucherForEdit(companyId, type, vId);

  if (!voucher) {
    return notFound();
  }

  // 2. Fetch Masters (Ledgers & Items) for Dropdowns
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

  // 3. Sanitize Ledgers to fix TypeScript "group is possibly null" error
  const sanitizedLedgers = ledgers.map((l) => ({
    ...l,
    group: l.group || { name: "Uncategorized" },
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileEdit className="text-blue-600" />
            Edit {type} Voucher
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

      {/* EDIT FORM */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <SalesPurchaseEditForm
          voucher={voucher}
          companyId={companyId}
          type={type.toUpperCase()} // Passed explicitly now
          ledgers={sanitizedLedgers}
          items={items}
        />
      </div>
    </div>
  );
}
