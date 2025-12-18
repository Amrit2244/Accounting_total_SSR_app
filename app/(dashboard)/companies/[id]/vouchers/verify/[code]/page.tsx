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
  Info,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// Helper to get current user ID
async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
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

  if (!voucher) {
    return (
      <div className="p-8 text-center bg-white rounded-[2.5rem] border border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 uppercase">
          Voucher Not Found
        </h1>
        <Link
          href={`/companies/${id}/vouchers/verify`}
          className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2 mt-4"
        >
          <ArrowLeft size={16} /> Back to Queue
        </Link>
      </div>
    );
  }

  // ✅ CHECK: Is the current user the maker?
  const isMaker = voucher.createdById === currentUserId;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/companies/${id}/vouchers`}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-slate-900 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="font-black uppercase text-[10px] tracking-widest">
            Back to Queue
          </span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        {/* Top Banner */}
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {voucher.type}
              </span>
              <span className="text-slate-400 font-mono text-sm">
                #{voucher.voucherNo}
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Verify Transaction
            </h1>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Creation Code
            </p>
            <p className="text-3xl font-mono font-black text-blue-400">
              {voucher.transactionCode}
            </p>
          </div>
        </div>

        {/* Voucher Info Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-slate-100 bg-slate-50/50">
          <InfoItem
            icon={<Calendar size={14} />}
            label="Date"
            value={new Date(voucher.date).toLocaleDateString()}
          />
          <InfoItem
            icon={<User size={14} />}
            label="Created By"
            value={voucher.createdBy.name}
          />
          <InfoItem
            icon={<Hash size={14} />}
            label="Reference"
            value={voucher.reference || "N/A"}
          />
          <InfoItem
            icon={<FileText size={14} />}
            label="Attachment"
            value={
              voucher.attachmentUrl ? (
                <a
                  href={voucher.attachmentUrl}
                  target="_blank"
                  className="text-blue-600 flex items-center gap-1 hover:underline"
                >
                  View Proof <ExternalLink size={12} />
                </a>
              ) : (
                "No Proof"
              )
            }
          />
        </div>

        {/* Table Rendering (Kept same as previous stable version) */}
        <div className="p-8">
          <table className="w-full text-left border-collapse border border-slate-200 rounded-3xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase">
                  Ledger Account
                </th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase">
                  Debit (₹)
                </th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase">
                  Credit (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voucher.entries.map((entry: any) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-slate-700">
                    {entry.ledger?.name || "Unassigned"}
                    <span className="block text-[9px] text-slate-400 font-black uppercase">
                      {entry.ledger?.group?.name}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-blue-600">
                    {entry.amount > 0 ? entry.amount.toFixed(2) : ""}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-orange-600">
                    {entry.amount < 0 ? Math.abs(entry.amount).toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Footer with Logic */}
        <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          {isMaker ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
              <AlertTriangle size={20} />
              <div>
                <p className="text-sm font-black uppercase tracking-tight">
                  Authorisation Restricted
                </p>
                <p className="text-xs font-medium">
                  You cannot verify this entry because you created it. Please
                  ask another manager to review.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs font-medium">
              Reviewing this will update stock levels and ledger balances.
            </div>
          )}

          {/* ✅ Button is disabled if current user is the maker */}
          <VerifyActionBtn voucherId={voucher.id} disabled={isMaker} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </p>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}
