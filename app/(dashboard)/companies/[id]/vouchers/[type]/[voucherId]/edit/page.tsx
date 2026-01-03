import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  FileEdit,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import SalesPurchaseEditForm from "@/components/forms/SalesPurchaseEditForm";
import VoucherEditForm from "@/components/forms/VoucherEditForm";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

async function getUserRole(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return "USER";
    const { payload } = await jwtVerify(session, encodedKey);
    return (payload.role as string) || "USER";
  } catch {
    return "USER";
  }
}

/**
 * SERVER ACTION: Fetches voucher with all sub-tables
 */
async function getFullVoucherData(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };

  const standardInclude = {
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
    createdBy: { select: { name: true } },
  };

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

  const voucher: any = await getFullVoucherData(companyId, vType, vId);
  if (!voucher) return notFound();

  const userRole = await getUserRole();
  const isAdmin = userRole === "ADMIN";

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

  const ledgers = rawLedgers.map((ledger) => ({
    ...ledger,
    group: ledger.group || { name: "Uncategorized" },
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
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

          <div
            className={`hidden md:flex items-center gap-3 px-4 py-2 border rounded-xl ${
              isAdmin
                ? "bg-emerald-50 border-emerald-100"
                : "bg-indigo-50 border-indigo-100"
            }`}
          >
            {isAdmin ? (
              <ShieldCheck size={16} className="text-emerald-600" />
            ) : (
              <ShieldAlert size={16} className="text-indigo-600" />
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isAdmin ? "text-emerald-700" : "text-indigo-700"
              }`}
            >
              {isAdmin
                ? "Admin Auto-Verify Active"
                : "Maker-Checker Protocol Active"}
            </span>
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden relative">
          {/* DYNAMIC WARNING BANNER BASED ON ROLE */}
          {isAdmin ? (
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-emerald-100 rounded-lg">
                <ShieldCheck size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  Instant Audit Update
                </p>
                <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                  As an Admin, your modifications will be{" "}
                  <strong>auto-verified</strong>. Ledgers and reports will
                  update immediately upon saving.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-b border-red-100 p-4 flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-red-100 rounded-lg">
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs font-black text-red-900 uppercase tracking-wide">
                  Approval Reset Required
                </p>
                <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                  Modifying this voucher will revoke its "Verified" status. It
                  will return to the pending queue for re-approval by a checker.
                </p>
              </div>
            </div>
          )}

          <div className="p-4">
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
                key={voucher.id}
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
            <p>
              Current Verifier:{" "}
              {voucher.verifiedBy?.name ||
                (isAdmin ? "Auto-Verify" : "Pending")}
            </p>
            <p>TXID: {voucher.transactionCode}</p>
          </div>
          <p>Secure-Kernel v1.2</p>
        </div>
      </div>
    </div>
  );
}
