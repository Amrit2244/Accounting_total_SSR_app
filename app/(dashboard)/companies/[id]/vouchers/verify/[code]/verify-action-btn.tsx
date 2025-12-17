"use client";

import { useState, useTransition } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle, Loader2, PartyPopper } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function VerifyActionBtn({ voucherId }: { voucherId: number }) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();
  const companyId = params.id;

  const handleVerify = () => {
    if (
      !confirm(
        "CONFIRMATION: Are you sure you want to verify and post this transaction to the ledger?"
      )
    )
      return;

    startTransition(async () => {
      const res = await verifyVoucher(voucherId);
      if (res.error) {
        alert("Error: " + res.error);
      } else {
        // 1. Show Success Animation/State
        setIsSuccess(true);

        // 2. Short delay to let the user see the success state
        setTimeout(() => {
          // 3. Redirect back to the Daybook List
          router.push(`/companies/${companyId}/vouchers`);
          router.refresh(); // Ensure the list reflects the new "APPROVED" status
        }, 1500);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <PartyPopper size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">VERIFIED!</h2>
          <p className="text-slate-500 font-medium mt-1">
            Transaction posted to ledger successfully.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
            <Loader2 size={14} className="animate-spin" /> Redirecting to
            Daybook
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleVerify}
      disabled={isPending}
      className="bg-[#003366] hover:bg-black text-white px-8 py-2.5 rounded shadow-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          PROCESSING...
        </>
      ) : (
        <>
          <CheckCircle
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
          AUTHORIZE & POST
        </>
      )}
    </button>
  );
}
