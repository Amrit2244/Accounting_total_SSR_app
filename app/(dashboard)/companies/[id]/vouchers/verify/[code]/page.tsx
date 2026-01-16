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
  Layers,
  ShieldCheck,
  CheckCircle,
  ScanBarcode,
  Receipt,
} from "lucide-react";

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(
      session,
      new TextEncoder().encode(process.env.SESSION_SECRET)
    );
    return {
      id:
        typeof payload.userId === "string"
          ? parseInt(payload.userId)
          : (payload.userId as number),
      role: (payload.role as string) || "USER",
    };
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

  const result = await getVoucherByCode(code, companyId);
  const currentUser = await getCurrentUser();

  if (!result || !result.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Voucher Not Found
          </h1>
          <p className="text-slate-500 text-xs mb-6 uppercase font-bold tracking-widest">
            Code: {code}
          </p>
          <Link
            href={`/companies/${id}/vouchers`}
            className="text-white bg-slate-900 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest inline-block"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const voucher = result as any;

  const isAdmin = currentUser?.role === "ADMIN";
  const isMaker = voucher.createdById === currentUser?.id;
  const isApproved = voucher.status === "APPROVED";
  const isRestricted = isMaker && !isAdmin;

  // Check if it is a Trade Voucher (Sales/Purchase)
  const isTradeVoucher = ["SALES", "PURCHASE"].includes(voucher.type);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <Link
          href={`/companies/${id}/vouchers`}
          className="inline-flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 shadow-sm w-fit transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Daybook</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
          {/* HEADER */}
          <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border bg-slate-700 border-slate-600 text-slate-300">
                  {voucher.type}
                </span>
                <span className="text-slate-400 font-mono text-sm font-bold">
                  #{voucher.voucherNo}
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight leading-none text-white flex items-center gap-3">
                {isApproved ? (
                  <CheckCircle className="text-emerald-400" size={32} />
                ) : (
                  <ShieldCheck className="text-amber-400" size={32} />
                )}
                {isApproved ? "Transaction Verified" : "Verification Required"}
              </h1>
            </div>

            {/* HEADER TXID DISPLAY */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm min-w-[200px] text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                <ScanBarcode size={12} /> TXID Code
              </p>
              <p className="text-2xl font-mono font-black text-blue-400 tracking-tight leading-none break-all">
                {voucher.transactionCode}
              </p>
            </div>
          </div>

          {/* METADATA GRID - UPDATED */}
          <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8 bg-slate-50 border-b border-slate-100">
            <InfoItem
              icon={<Calendar size={16} />}
              label="Posting Date"
              value={new Date(voucher.date).toLocaleDateString("en-IN")}
            />

            {/* CONDITIONAL: Show Reference No for Sales/Purchase */}
            {isTradeVoucher ? (
              <InfoItem
                icon={<Receipt size={16} />}
                label="Reference / Inv #"
                // Fallback to 'N/A' if the field is empty or missing
                value={
                  voucher.refNo ||
                  voucher.referenceNumber ||
                  voucher.invoiceNo ||
                  "N/A"
                }
                isHighlight={true}
              />
            ) : (
              <InfoItem
                icon={<User size={16} />}
                label="Maker"
                value={voucher.createdBy?.name || "Unknown"}
              />
            )}

            <InfoItem
              icon={<Hash size={16} />}
              label="Workflow Status"
              value={voucher.status}
            />

            <InfoItem
              icon={<FileText size={16} />}
              label="Net Amount"
              value={`₹${Number(voucher.totalAmount).toLocaleString("en-IN")}`}
              isHighlight
            />
          </div>

          {/* TABLE AREA */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Layers size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Ledger Postings
                </span>
              </div>
              {/* Optional: Show Party Name if available for Trade Vouchers */}
              {isTradeVoucher && voucher.partyName && (
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Party: {voucher.partyName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {voucher.ledgerEntries?.map((entry: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {entry.ledger?.name}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      entry.amount < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {entry.amount < 0 ? "Dr" : "Cr"}{" "}
                    {Math.abs(entry.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS FOOTER */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-xs font-medium">
              {isApproved ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle size={14} />
                  <span>Authorized and posted to ledger.</span>
                </div>
              ) : isRestricted ? (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                  <AlertTriangle size={14} />
                  <span className="font-black uppercase text-[10px]">
                    Self-Verification Locked (Maker Mode)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck
                    size={14}
                    className={isAdmin ? "text-indigo-600" : ""}
                  />
                  <span>
                    {isAdmin
                      ? "Admin Mode: Self-Authorization Enabled"
                      : "Please verify all ledger and amount details."}
                  </span>
                </div>
              )}
            </div>

            {!isApproved && (
              <VerifyActionBtn
                voucherId={voucher.id}
                type={voucher.type}
                isCreator={isMaker}
                companyId={companyId}
                isAdmin={isAdmin}
                disabled={isRestricted}
              />
            )}
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
          isHighlight ? "text-indigo-600 font-mono text-lg" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
