"use client";

import { useState, useTransition } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle, Loader2, ShieldCheck, Lock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import confetti from "canvas-confetti";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleVerify = async () => {
    startTransition(async () => {
      const result = await verifyVoucher(voucherId, type);
      if (result.success) {
        // ✅ TRIGGER CONFETTI
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#3B82F6", "#F59E0B"],
        });

        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/companies/${params.id}/vouchers`);
          router.refresh();
        }, 2500); // Wait for animation
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <ShieldCheck size={48} strokeWidth={2} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Verified!
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-8">
              Transaction has been authorized successfully. Redirecting...
            </p>

            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <Loader2 className="animate-spin" size={16} />
              <span>Processing Ledger</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isPending || disabled || showSuccess}
        className={`
            relative overflow-hidden group flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all
            ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                : "bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-95"
            }
        `}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : disabled ? (
          <Lock size={16} />
        ) : (
          <CheckCircle
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
        )}

        <span>
          {disabled
            ? "Verification Restricted"
            : isPending
            ? "Verifying..."
            : "Authorize Entry"}
        </span>
      </button>
    </>
  );
}
