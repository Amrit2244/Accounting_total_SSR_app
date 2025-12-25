import { getVoucherByCode } from "@/app/actions/voucher";
import VerifyActionBtn from "./verify-action-btn";
import Link from "next/link";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  Calendar,
  Hash,
  User,
  FileText,
  AlertTriangle,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";

async function getCurrentUserId() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(
      session,
      new TextEncoder().encode(process.env.SESSION_SECRET)
    );
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch {
    return null;
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string; code: string }>;
}) {
  const { id, code } = await params;
  const companyId = parseInt(id);

  // Fetch full voucher
  const voucher = await getVoucherByCode(code, companyId);
  const currentUserId = await getCurrentUserId();

  if (!voucher)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            The verification link you used is either incorrect or has expired.
            Please check the URL or contact the sender.
          </p>
          <Link
            href={`/companies/${id}/vouchers`}
            className="text-white bg-slate-900 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );

  const isMaker = voucher.createdById === currentUserId;
  const hasInventory = voucher.inventory && voucher.inventory.length > 0;

  // Safe Property Access
  const reference = "reference" in voucher ? (voucher as any).reference : null;

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

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* Navigation */}
        <Link
          href={`/companies/${id}/vouchers`}
          className="inline-flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-white transition-all shadow-sm w-fit"
        >
          <ArrowLeft size={16} />
          <span>Back to Vouchers</span>
        </Link>

        {/* MAIN CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* HEADER */}
          <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                    voucher.type === "SALES"
                      ? "bg-emerald-500 border-emerald-400 text-emerald-50"
                      : voucher.type === "PURCHASE"
                      ? "bg-blue-500 border-blue-400 text-blue-50"
                      : "bg-slate-700 border-slate-600 text-slate-300"
                  }`}
                >
                  {voucher.type}
                </span>
                <span className="text-slate-400 font-mono text-sm font-bold">
                  #{voucher.voucherNo}
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight leading-none text-white flex items-center gap-3">
                <ShieldCheck className="text-emerald-400" size={32} />
                Verify Transaction
              </h1>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm min-w-[200px]">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Secure Verification Code
              </p>
              <p className="text-2xl font-mono font-black text-blue-400 tracking-tight leading-none break-all">
                {voucher.transactionCode}
              </p>
            </div>
          </div>

          {/* METADATA GRID */}
          <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8 bg-slate-50 border-b border-slate-100">
            <InfoItem
              icon={<Calendar size={16} />}
              label="Transaction Date"
              value={new Date(voucher.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <InfoItem
              icon={<User size={16} />}
              label="Created By"
              value={voucher.createdBy?.name || "Unknown"}
            />
            <InfoItem
              icon={<Hash size={16} />}
              label="Reference No"
              value={reference || "N/A"}
            />
            <InfoItem
              icon={<FileText size={16} />}
              label="Total Amount"
              value={`₹${voucher.totalAmount.toLocaleString("en-IN")}`}
              isHighlight
            />
          </div>

          {/* INVENTORY TABLE */}
          {hasInventory && (
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Package size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Inventory Items
                </h3>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Item Description</th>
                      <th className="px-6 py-3 text-right">Qty</th>
                      <th className="px-6 py-3 text-right">Rate</th>
                      <th className="px-6 py-3 text-right bg-slate-100/50">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {voucher.inventory.map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {inv.stockItem?.name || "Unknown Item"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                          {Math.abs(inv.quantity)}{" "}
                          <span className="text-[10px] text-slate-400">
                            {inv.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                          {inv.rate.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 bg-slate-50/30">
                          {inv.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEDGER DISTRIBUTION */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <Layers size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                Ledger Accounts
              </h3>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Particulars</th>
                    <th className="px-6 py-3 text-right w-40">Debit</th>
                    <th className="px-6 py-3 text-right w-40">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {voucher.entries.map((e: any) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {e.ledger?.name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                          {e.ledger?.group?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                        {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : ""}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-rose-700 bg-rose-50/10">
                        {e.amount > 0 ? e.amount.toFixed(2) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NARRATION */}
          {voucher.narration && (
            <div className="px-8 pb-8">
              <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-slate-700 text-sm leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-200" />
                <span className="font-black uppercase text-[10px] text-amber-600/70 tracking-widest block mb-2">
                  Narration Notes
                </span>
                "{voucher.narration}"
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              {isMaker ? (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <AlertTriangle size={14} />
                  <span>
                    You created this voucher. Self-verification is disabled.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck size={14} />
                  <span>
                    Please review all details carefully before verifying.
                  </span>
                </div>
              )}
            </div>
            <VerifyActionBtn
              voucherId={voucher.id}
              type={voucher.type}
              disabled={isMaker}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, isHighlight }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </p>
      </div>
      <div
        className={`text-base font-bold truncate ${
          isHighlight ? "text-indigo-600 font-mono text-xl" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
