"use client";

import { useState, useTransition } from "react";
import { verifyVoucher, rejectVoucher } from "@/app/actions/voucher";
import {
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function VerifyActionBtn({
  voucherId,
  type,
  disabled,
}: {
  voucherId: number;
  type: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const params = useParams();

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to authorize this transaction?"))
      return;

    startTransition(async () => {
      // ✅ Pass Type
      const result = await verifyVoucher(voucherId, type);
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/companies/${params.id}/vouchers`);
          router.refresh();
        }, 2000);
      } else {
        alert(result.error);
      }
    });
  };

  const handleRejectSubmit = async () => {
    if (!reason.trim()) return alert("Reason required");
    startTransition(async () => {
      // ✅ Pass Type
      const result = await rejectVoucher(voucherId, type, reason);
      if (result.success) router.push(`/companies/${params.id}/vouchers`);
      else alert(result.error);
    });
  };

  return (
    <>
      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Approved!
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              The transaction has been successfully authorized and posted to the
              ledger.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
              <Loader2 size={12} className="animate-spin text-blue-600" />{" "}
              Redirecting...
            </div>
          </div>
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex items-center gap-3">
        {!disabled && (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isPending || showSuccess}
            className="bg-white hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase border border-rose-200 flex items-center gap-2 transition-all hover:border-rose-300"
          >
            <XCircle size={14} /> Reject
          </button>
        )}

        <button
          onClick={handleVerify}
          disabled={isPending || disabled || showSuccess}
          className="bg-[#003366] hover:bg-black text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-900/20 font-black text-[10px] uppercase flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          {disabled ? "Restricted" : "Authorize Entry"}
        </button>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wide">
                Reason for Rejection
              </h2>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why this entry is being rejected..."
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none mb-4 resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 text-[10px] font-black text-slate-500 hover:bg-slate-100 rounded-xl uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isPending}
                className="flex-1 py-2.5 text-[10px] font-black bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 uppercase transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
