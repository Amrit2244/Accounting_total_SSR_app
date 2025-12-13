"use client";

import { useState } from "react";
import { verifyVoucherAction } from "@/app/actions/voucher";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyActionBtn({ voucherId }: { voucherId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const confirm = window.confirm(
      "Are you sure you want to AUTHORIZE this transaction?"
    );
    if (!confirm) return;

    setLoading(true);
    const res = await verifyVoucherAction(voucherId);

    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      alert("Transaction Verified Successfully!");
      router.refresh(); // Update UI
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded font-bold text-lg shadow-lg flex items-center gap-3 transition-transform hover:-translate-y-1"
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <ShieldCheck size={24} />
      )}
      {loading ? "AUTHORIZING..." : "VERIFY & POST"}
    </button>
  );
}
