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
  const voucher = await getVoucherByCode(code, companyId);
  const currentUserId = await getCurrentUserId();

  if (!voucher)
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 mt-10 shadow-sm max-w-md mx-auto">
        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
          Invalid or Expired Link
        </h1>
        <Link
          href={`/companies/${id}/vouchers/verify`}
          className="text-blue-600 text-[10px] font-black uppercase mt-4 inline-block hover:underline tracking-widest"
        >
          Return to Queue
        </Link>
      </div>
    );

  const isMaker = voucher.createdById === currentUserId;

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-6 font-sans">
      <Link
        href={`/companies/${id}/vouchers/verify`}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors pl-1"
      >
        <ArrowLeft size={12} /> Back to Queue
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* COMPACT BANNER */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 bg-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-500">
                {voucher.type}
              </span>
              <span className="text-slate-400 font-mono text-[10px] font-bold">
                #{voucher.voucherNo}
              </span>
            </div>
            <h1 className="text-lg font-black uppercase tracking-tight leading-none">
              Verify Transaction
            </h1>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-0.5">
              Secure Code
            </p>
            <p className="text-xl font-mono font-black text-blue-400 tracking-tight leading-none">
              {voucher.transactionCode}
            </p>
          </div>
        </div>

        {/* INFO GRID (Dense) */}
        <div className="p-4 grid grid-cols-4 gap-4 bg-slate-50 border-b border-slate-100">
          <InfoItem
            icon={<Calendar size={10} />}
            label="Date"
            value={new Date(voucher.date).toLocaleDateString()}
          />
          <InfoItem
            icon={<User size={10} />}
            label="Maker"
            value={voucher.createdBy.name}
          />
          <InfoItem
            icon={<Hash size={10} />}
            label="Reference"
            value={voucher.reference || "N/A"}
          />
          <InfoItem
            icon={<FileText size={10} />}
            label="Proof"
            value={
              voucher.attachmentUrl ? (
                <a
                  href={voucher.attachmentUrl}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View File
                </a>
              ) : (
                <span className="text-slate-400 italic">None attached</span>
              )
            }
          />
        </div>

        {/* ENTRIES TABLE */}
        <div className="p-4">
          <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-[11px]">
            <thead className="bg-slate-100 font-black text-slate-500 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="p-2 pl-3">Ledger Account</th>
                <th className="p-2 text-right">Debit</th>
                <th className="p-2 text-right pr-3">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voucher.entries.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 pl-3">
                    <div className="font-bold text-slate-800">
                      {e.ledger?.name}
                    </div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tight">
                      {e.ledger?.group?.name}
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-blue-700">
                    {e.amount > 0 ? e.amount.toFixed(2) : ""}
                  </td>
                  <td className="p-2 text-right pr-3 font-mono font-bold text-orange-700">
                    {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {isMaker ? (
            <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <AlertTriangle size={12} /> Verification restricted for maker.
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-medium italic">
              Review details carefully before authorizing.
            </div>
          )}
          <VerifyActionBtn voucherId={voucher.id} disabled={isMaker} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
        {icon} {label}
      </p>
      <div className="text-xs font-bold text-slate-900 truncate">{value}</div>
    </div>
  );
}
