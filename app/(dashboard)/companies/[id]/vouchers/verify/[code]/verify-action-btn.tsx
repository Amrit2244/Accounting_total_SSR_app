"use client";

import { useState, useTransition } from "react";
import { verifyVoucher, rejectVoucher } from "@/app/actions/voucher";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import confetti from "canvas-confetti"; // ✅ Import Confetti

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={48} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              Verified!
            </h3>
            <p className="text-slate-500 mb-8">
              Redirecting to transactions...
            </p>
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isPending || disabled || showSuccess}
        className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xs uppercase flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        {disabled ? "Restricted" : "Authorize Entry"}
      </button>
    </>
  );
}
