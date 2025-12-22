"use client";

import { useState } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Ban,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function VerifyBtn({
  voucherId,
  type,
  isCreator,
  companyId, // ✅ Added Prop
}: {
  voucherId: number;
  type: string;
  isCreator: boolean;
  companyId: number; // ✅ Added Type
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to authorize this voucher?")) return;

    setLoading(true);
    setError("");

    const result = await verifyVoucher(voucherId, type.toUpperCase());

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // --- PARTY POPPER ANIMATION ---
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10B981", "#3B82F6", "#FBBF24"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10B981", "#3B82F6", "#FBBF24"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

      // --- SHOW MODAL & REDIRECT ---
      setShowSuccess(true);

      setTimeout(() => {
        // ✅ Redirect to Voucher List
        router.push(`/companies/${companyId}/vouchers`);
        router.refresh(); // Refresh data on the list page
      }, 2500);
    }
  };

  if (isCreator) {
    return (
      <div className="flex flex-col items-end">
        <button
          disabled
          className="bg-slate-100 text-slate-400 text-[10px] font-bold px-4 py-2 rounded flex items-center gap-2 border border-slate-200 cursor-not-allowed"
          title="Maker-Checker Rule: You cannot verify a voucher you created."
        >
          <Ban size={14} />
          Self-Verification Blocked
        </button>
      </div>
    );
  }

  return (
    <>
      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-xs mx-4 animate-in zoom-in-95 duration-300 transform scale-110">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-50 shadow-emerald-200 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
              Authorized!
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
              Redirecting to Daybook...
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 size={12} className="animate-spin" /> Updating Records...
            </div>
          </div>
        </div>
      )}

      {/* BUTTON */}
      <div className="flex flex-col items-end gap-2">
        {error && (
          <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1 animate-in slide-in-from-right-2">
            <AlertCircle size={10} /> {error}
          </span>
        )}
        <button
          onClick={handleVerify}
          disabled={loading || showSuccess}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-6 py-2.5 rounded shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              AUTHORIZE VOUCHER
            </>
          )}
        </button>
      </div>
    </>
  );
}
