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
      <div className="p-10 text-center bg-white rounded-xl border border-slate-200 mt-10 shadow-sm max-w-md mx-auto">
        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
          Invalid or Expired Link
        </h1>
        <Link
          href={`/companies/${id}/vouchers`}
          className="text-blue-600 font-bold uppercase text-xs mt-4 inline-block hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );

  const isMaker = voucher.createdById === currentUserId;
  const hasInventory = voucher.inventory && voucher.inventory.length > 0;

  // Safe Property Access
  const reference = "reference" in voucher ? (voucher as any).reference : null;
  const attachmentUrl =
    "attachmentUrl" in voucher ? (voucher as any).attachmentUrl : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 font-sans px-4">
      <Link
        href={`/companies/${id}/vouchers`}
        className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-slate-800 transition-colors w-fit group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Vouchers
      </Link>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* HEADER */}
        <div className="bg-slate-900 px-8 py-6 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                  voucher.type === "SALES"
                    ? "bg-emerald-500 border-emerald-400"
                    : voucher.type === "PURCHASE"
                    ? "bg-blue-500 border-blue-400"
                    : "bg-slate-700 border-slate-600"
                }`}
              >
                {voucher.type}
              </span>
              <span className="text-slate-400 font-mono text-xs font-bold opacity-80">
                #{voucher.voucherNo}
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-white">
              Verify Transaction
            </h1>
          </div>
          <div className="text-left md:text-right bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Secure Code
            </p>
            <p className="text-2xl font-mono font-black text-blue-400 tracking-tight leading-none">
              {voucher.transactionCode}
            </p>
          </div>
        </div>

        {/* METADATA */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 border-b border-slate-100">
          <InfoItem
            icon={<Calendar size={14} />}
            label="Date"
            value={new Date(voucher.date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          />
          <InfoItem
            icon={<User size={14} />}
            label="Maker"
            value={voucher.createdBy?.name || "Unknown"}
          />
          <InfoItem
            icon={<Hash size={14} />}
            label="Reference"
            value={reference || "N/A"}
          />
          <InfoItem
            icon={<FileText size={14} />}
            label="Amount"
            value={`₹${voucher.totalAmount.toLocaleString("en-IN")}`}
          />
        </div>

        {/* ✅ INVENTORY TABLE */}
        {hasInventory && (
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <Package size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">
                Inventory Details
              </h3>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right bg-slate-100/50">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {voucher.inventory.map((inv: any) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {inv.stockItem?.name || "Unknown Item"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-600">
                        {Math.abs(inv.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-600">
                        {inv.rate.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/30">
                        {inv.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEDGER TABLE */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 text-orange-600">
            <Layers size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">
              Ledger Distribution
            </h3>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Particulars</th>
                  <th className="px-4 py-3 text-right w-32">Debit</th>
                  <th className="px-4 py-3 text-right w-32">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {voucher.entries.map((e: any) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">
                        {e.ledger?.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                        {e.ledger?.group?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                      {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 bg-rose-50/10">
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
          <div className="px-6 pb-6">
            <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-slate-700 text-xs leading-relaxed">
              <span className="font-black uppercase text-[9px] text-yellow-600/70 tracking-widest block mb-1">
                Narration
              </span>
              "{voucher.narration}"
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 italic">
            {isMaker ? "Creator cannot verify." : "Review carefully."}
          </div>
          <VerifyActionBtn
            voucherId={voucher.id}
            type={voucher.type}
            disabled={isMaker}
          />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </p>
      </div>
      <div className="text-sm font-bold text-slate-900 truncate">{value}</div>
    </div>
  );
}
