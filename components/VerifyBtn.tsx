"use client";

import { useState } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Zap, // Icon for Admin bypass
} from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function VerifyBtn({
  voucherId,
  type,
  isCreator,
  companyId,
  isAdmin, // New prop
}: {
  voucherId: number;
  type: string;
  isCreator: boolean;
  companyId: number;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const message =
      isAdmin && isCreator
        ? "Admin Privilege: You are about to self-authorize this voucher. Continue?"
        : "Are you sure you want to authorize this voucher? This action is logged.";

    if (!confirm(message)) return;

    setLoading(true);
    setError("");

    const result = await verifyVoucher(voucherId, type.toUpperCase());

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // --- CELEBRATION ANIMATION ---
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: isAdmin
            ? ["#6366f1", "#a855f7", "#ffffff"]
            : ["#10B981", "#3B82F6", "#FBBF24"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: isAdmin
            ? ["#6366f1", "#a855f7", "#ffffff"]
            : ["#10B981", "#3B82F6", "#FBBF24"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      setShowSuccess(true);

      setTimeout(() => {
        router.push(`/companies/${companyId}/vouchers`);
        router.refresh();
      }, 2000);
    }
  };

  // --- MAKER-CHECKER BLOCKED STATE (Standard User Only) ---
  // If user is creator AND NOT an admin, lock the button.
  if (isCreator && !isAdmin) {
    return (
      <div className="flex flex-col items-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl cursor-not-allowed select-none">
          <Lock size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Self-Verification Locked
          </span>
        </div>
        <p className="text-[9px] text-slate-400 font-bold pr-1 flex items-center gap-1">
          <ShieldCheck size={10} /> Maker-Checker Rule Applied
        </p>
      </div>
    );
  }

  return (
    <>
      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                isAdmin
                  ? "from-indigo-500 to-purple-600"
                  : "from-emerald-400 to-teal-500"
              }`}
            />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 border shadow-lg ${
                isAdmin
                  ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100"
              }`}
            >
              <ShieldCheck size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {isAdmin ? "Admin Authorized" : "Voucher Authorized"}
            </h3>

            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed px-4">
              The transaction has been successfully{" "}
              {isAdmin ? "overruled and" : ""} verified. Redirecting...
            </p>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Loader2
                size={12}
                className={`animate-spin ${
                  isAdmin ? "text-indigo-500" : "text-emerald-500"
                }`}
              />
              <span>Synchronizing Ledgers</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTON */}
      <div className="flex flex-col items-end gap-3">
        {error && (
          <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in slide-in-from-right-2 shadow-sm">
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || showSuccess}
          className={`group relative pl-5 pr-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
            ${
              isAdmin
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 hover:shadow-indigo-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-600/30"
            }
          `}
        >
          {loading ? (
            <Loader2
              size={16}
              className={`animate-spin ${
                isAdmin ? "text-indigo-200" : "text-emerald-200"
              }`}
            />
          ) : isAdmin ? (
            <Zap size={16} className="text-indigo-200 group-hover:text-white" />
          ) : (
            <CheckCircle
              size={16}
              className="text-emerald-200 group-hover:text-white"
            />
          )}
          <span>
            {loading
              ? "Processing..."
              : isAdmin && isCreator
              ? "Admin Self-Verify"
              : isAdmin
              ? "Admin Authorize"
              : "Authorize Voucher"}
          </span>
        </button>
      </div>
    </>
  );
}
