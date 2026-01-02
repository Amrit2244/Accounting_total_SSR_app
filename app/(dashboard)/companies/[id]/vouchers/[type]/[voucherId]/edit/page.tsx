import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileEdit,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

import SalesPurchaseEditForm from "@/components/forms/SalesPurchaseEditForm";
import VoucherEditForm from "@/components/forms/VoucherEditForm";

/**
 * SERVER ACTION: Fetches voucher with all sub-tables (Maker-Checker Hydration)
 */
async function getFullVoucherData(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };

  // Standard relations for all accounting vouchers
  const standardInclude = {
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
    createdBy: { select: { name: true } },
  };

  // Relations for inventory-based vouchers
  const inventoryInclude = {
    ...standardInclude,
    inventoryEntries: { include: { stockItem: true } },
  };

  try {
    switch (t) {
      case "SALES":
        return await prisma.salesVoucher.findUnique({
          where,
          include: inventoryInclude,
        });
      case "PURCHASE":
        return await prisma.purchaseVoucher.findUnique({
          where,
          include: inventoryInclude,
        });
      case "PAYMENT":
        return await prisma.paymentVoucher.findUnique({
          where,
          include: standardInclude,
        });
      case "RECEIPT":
        return await prisma.receiptVoucher.findUnique({
          where,
          include: standardInclude,
        });
      case "CONTRA":
        return await prisma.contraVoucher.findUnique({
          where,
          include: standardInclude,
        });
      case "JOURNAL":
        return await prisma.journalVoucher.findUnique({
          where,
          include: standardInclude,
        });
      default:
        return null;
    }
  } catch (error) {
    console.error("Fetch Error:", error);
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
  const vType = type.toUpperCase();

  // 1. Fetch the Voucher Data with its specific Dr/Cr lines
  const voucher: any = await getFullVoucherData(companyId, vType, vId);

  if (!voucher) return notFound();

  // 2. Fetch Master Data
  const [rawLedgers, items] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      include: { group: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  // ✅ FIX: SANITIZE LEDGERS (Resolves TypeScript Build Error)
  // This ensures the 'group' property is never null, satisfying the Form component props
  const ledgers = rawLedgers.map((ledger) => ({
    ...ledger,
    group: ledger.group || { name: "Uncategorized" },
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* Background Subtle Grid Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* TOP NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-30">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase">
                <FileEdit size={22} className="text-indigo-600" />
                Edit {vType} Voucher
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}/vouchers`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Daybook
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">
                  Modify Transaction #{voucher.voucherNo}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <ShieldAlert size={16} className="text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Maker-Checker Protocol Active
            </span>
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden relative">
          {/* Warning Banner: Explain the reset logic to user */}
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-start gap-3">
            <div className="mt-0.5 p-1 bg-red-100 rounded-lg">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs font-black text-red-900 uppercase tracking-wide">
                Approval Reset Required
              </p>
              <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                Modifying this voucher will instantly revoke its "Verified"
                status. It will be moved back to the pending queue for
                re-approval by an authorized checker.
              </p>
            </div>
          </div>

          <div className="p-4">
            {/* Logic to choose which form to display based on Voucher Type */}
            {["SALES", "PURCHASE"].includes(vType) ? (
              <SalesPurchaseEditForm
                voucher={voucher}
                companyId={companyId}
                type={vType}
                ledgers={ledgers as any}
                items={items}
              />
            ) : (
              <VoucherEditForm
                key={voucher.id} // Forces React to reset the form state when a new voucher loads
                voucher={{ ...voucher, type: vType }}
                companyId={companyId}
                ledgers={ledgers as any}
              />
            )}
          </div>
        </div>

        {/* FOOTER AUDIT INFO */}
        <div className="flex justify-between items-center px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex gap-6">
            <p>Original Creator: {voucher.createdBy?.name || "System"}</p>
            <p>System Ref: {voucher.transactionCode || "N/A"}</p>
          </div>
          <p>Last Sync: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
