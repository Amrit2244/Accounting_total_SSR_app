"use client";

import { useState } from "react";
import { verifyVoucher } from "@/app/actions/voucher";
import { CheckCircle, Loader2 } from "lucide-react";

export default function VerifyBtn({ voucherId }: { voucherId: number }) {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    // Call the server action directly
    await verifyVoucher(voucherId);
    setLoading(false);
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Processing
        </>
      ) : (
        <>
          <CheckCircle size={12} />
          VERIFY
        </>
      )}
    </button>
  );
}
