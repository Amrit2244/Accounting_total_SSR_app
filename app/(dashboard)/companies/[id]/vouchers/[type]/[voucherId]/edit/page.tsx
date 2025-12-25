import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit, ChevronRight, AlertTriangle } from "lucide-react";
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

  // Sanitize ledgers for the form
  const sanitizedLedgers = ledgers.map((l: any) => ({
    ...l,
    group: l.group || { name: "Uncategorized" },
  }));

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

      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Cancel Edit"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight uppercase">
                <FileEdit size={22} className="text-indigo-600" />
                Edit {type} Voucher
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/vouchers`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Vouchers
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">
                  Edit #{voucher.voucherNo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />

          {/* Warning Banner */}
          <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-center gap-2 text-center">
            <AlertTriangle size={14} className="text-amber-600" />
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              Warning: Saving changes will generate a new Transaction ID and
              reset approval status.
            </p>
          </div>

          <div className="p-1">
            <SalesPurchaseEditForm
              voucher={voucher}
              companyId={companyId}
              type={type.toUpperCase()}
              ledgers={sanitizedLedgers}
              items={items}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
