"use client";

import { useState, useTransition } from "react";
import { verifyVoucher, rejectVoucher } from "@/app/actions/voucher"; // ✅ Import rejectVoucher
import {
  CheckCircle,
  XCircle,
  Loader2,
  PartyPopper,
  MessageSquare,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function VerifyActionBtn({
  voucherId,
  disabled,
}: {
  voucherId: number;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const params = useParams();

  const handleVerify = async () => {
    if (!confirm("Authorize and post this transaction?")) return;
    startTransition(async () => {
      const result = await verifyVoucher(voucherId);
      if (result.success) router.push(`/companies/${params.id}/vouchers`);
    });
  };

  const handleRejectSubmit = async () => {
    if (!reason.trim()) return alert("Please provide a reason.");
    startTransition(async () => {
      const result = await rejectVoucher(voucherId, reason);
      if (result.success) router.push(`/companies/${params.id}/vouchers`);
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Reject Button */}
      {!disabled && (
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isPending}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-red-200"
        >
          <XCircle size={16} /> REJECT
        </button>
      )}

      {/* Authorize Button */}
      <button
        onClick={handleVerify}
        disabled={isPending || disabled}
        className="bg-[#003366] hover:bg-black text-white px-8 py-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        {disabled ? "RESTRICTED" : "AUTHORIZE & POST"}
      </button>

      {/* Rejection Modal Overlay */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <MessageSquare size={24} />
              <h2 className="text-xl font-black uppercase">Rejection Reason</h2>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Wrong tax rate applied, please check weight slip again..."
              className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-medium text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isPending}
                className="flex-1 py-3 font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                {isPending ? "Submitting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
