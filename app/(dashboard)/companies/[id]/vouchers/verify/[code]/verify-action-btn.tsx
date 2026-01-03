"use client";

import { useState, useTransition } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle, Loader2, ShieldCheck, Lock, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface VerifyActionBtnProps {
  voucherId: number;
  type: string;
  isCreator: boolean; // Added to fix build error
  companyId: number; // Added to fix build error
  isAdmin?: boolean;
  disabled?: boolean;
}

export default function VerifyActionBtn({
  voucherId,
  type,
  isCreator,
  companyId,
  isAdmin,
  disabled,
}: VerifyActionBtnProps) {
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    // Final logic check for Admin Bypass vs Standard Restriction
    if (isCreator && !isAdmin) {
      alert("Maker-Checker Rule: You cannot verify your own entry.");
      return;
    }

    startTransition(async () => {
      const result = await verifyVoucher(voucherId, type);
      if (result.success) {
        // Trigger different celebration colors for Admin
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: isAdmin
            ? ["#6366f1", "#4f46e5", "#ffffff"]
            : ["#10B981", "#3B82F6", "#F59E0B"],
        });

        setShowSuccess(true);

        setTimeout(() => {
          router.push(`/companies/${companyId}/vouchers`);
          router.refresh();
        }, 2000);
      } else {
        alert(result.error || "Verification failed. Please try again.");
      }
    });
  };

  return (
    <>
      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div
              className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${
                isAdmin
                  ? "from-indigo-500 to-purple-600"
                  : "from-emerald-400 to-teal-500"
              }`}
            />
            <div
              className={`w-24 h-24 ${
                isAdmin
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-emerald-50 text-emerald-600"
              } rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-lg`}
            >
              {isAdmin ? (
                <Star size={48} fill="currentColor" />
              ) : (
                <ShieldCheck size={48} />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {isAdmin ? "Admin Authorized" : "Entry Verified!"}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              The transaction has been successfully{" "}
              {isAdmin ? "overruled and " : ""}authorized for posting.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <Loader2 className="animate-spin" size={16} />
              <span>Updating Financials</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTON */}
      <button
        onClick={handleVerify}
        disabled={isPending || (disabled && !isAdmin) || showSuccess}
        className={`
            relative overflow-hidden group flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all
            ${
              disabled && !isAdmin
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                : isAdmin
                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95"
                : "bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-95"
            }
        `}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : disabled && !isAdmin ? (
          <Lock size={16} />
        ) : isAdmin ? (
          <Star size={16} fill="currentColor" className="animate-pulse" />
        ) : (
          <CheckCircle size={16} />
        )}

        <span>
          {disabled && !isAdmin
            ? "Checker Required"
            : isPending
            ? "Processing..."
            : isAdmin && isCreator
            ? "Self-Authorize (Admin)"
            : isAdmin
            ? "Authorize as Admin"
            : "Authorize Entry"}
        </span>
      </button>
    </>
  );
}
