"use client";

import { useTransition } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyActionBtn({ voucherId }: { voucherId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        // Refresh the page data without full reload to update status to "APPROVED"
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isPending}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-lg font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        "Processing..."
      ) : (
        <>
          <CheckCircle size={16} /> AUTHORIZE & POST
        </>
      )}
    </button>
  );
}
