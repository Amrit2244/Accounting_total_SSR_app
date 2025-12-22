"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { findVoucherByCode } from "@/app/actions/voucher"; // Updated import
import { useRouter } from "next/navigation";

export default function QuickVerify({ companyId }: { companyId: number }) {
  const [txid, setTxid] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (!txid || txid.length < 5) {
      setError("Enter valid ID");
      return;
    }
    setError("");

    startTransition(async () => {
      // ✅ Call the new Find function (Search Only)
      const result = await findVoucherByCode(txid, companyId);

      if (result.success && result.id && result.type) {
        // ✅ Redirect to the Voucher Details Page
        router.push(
          `/companies/${companyId}/vouchers/${result.type.toLowerCase()}/${
            result.id
          }`
        );
        setTxid("");
      } else {
        setError("Not Found");
      }
    });
  };

  return (
    <div className="bg-white p-1 rounded-lg flex items-center shadow-sm border border-slate-200">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
          <Search size={14} />
        </div>
        <input
          type="text"
          value={txid}
          onChange={(e) => {
            setTxid(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="TXID Search..."
          className={`text-xs font-mono pl-7 pr-2 py-1.5 rounded-md border-none focus:ring-0 w-32 placeholder:text-slate-400 uppercase tracking-widest ${
            error ? "text-red-600 bg-red-50" : "text-slate-700 bg-transparent"
          }`}
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={isPending}
        className="ml-1 bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
        title="Open Voucher"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ArrowRight size={12} />
        )}
      </button>
    </div>
  );
}
