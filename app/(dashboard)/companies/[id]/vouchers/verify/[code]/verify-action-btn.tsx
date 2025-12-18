"use client";

import { useState, useTransition } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle, Loader2, PartyPopper } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface VerifyActionBtnProps {
  voucherId: number;
  disabled?: boolean; // ✅ Added to receive restriction status
}

export default function VerifyActionBtn({
  voucherId,
  disabled,
}: VerifyActionBtnProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleVerify = async () => {
    if (
      !confirm(
        "Are you sure you want to authorize and post this transaction? This will update ledger balances and inventory levels."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await verifyVoucher(voucherId);
      if (result.success) {
        setIsSuccess(true);
        // Delay slightly so the user sees the success state
        setTimeout(() => {
          router.push(`/companies/${params.id}/vouchers`);
          router.refresh();
        }, 1500);
      } else {
        alert(result.error || "Failed to authorize voucher.");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-500 text-white px-8 py-2.5 rounded shadow-lg font-bold text-xs flex items-center gap-2 animate-bounce">
        <PartyPopper size={16} />
        TRANSACTION POSTED!
      </div>
    );
  }

  return (
    <button
      onClick={handleVerify}
      // ✅ Now disabled if isPending OR if the maker-checker rule is triggered
      disabled={isPending || disabled}
      className="bg-[#003366] hover:bg-black text-white px-8 py-2.5 rounded shadow-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
      title={
        disabled ? "You cannot authorize your own entry" : "Post to accounts"
      }
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
          {disabled ? "AUTHORIZATION RESTRICTED" : "AUTHORIZE & POST"}
        </>
      )}
    </button>
  );
}
