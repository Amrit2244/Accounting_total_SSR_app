"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { findVoucherByCode } from "@/app/actions/voucher";
import { useRouter } from "next/navigation";

export default function QuickVerify({ companyId }: { companyId: number }) {
  const [txid, setTxid] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    if (!txid || txid.length < 3) {
      setError(true);
      return;
    }
    setError(false);

    startTransition(async () => {
      const result = await findVoucherByCode(txid, companyId);

      if (result.success && result.id && result.type) {
        router.push(
          `/companies/${companyId}/vouchers/${result.type.toLowerCase()}/${
            result.id
          }`
        );
        setTxid("");
      } else {
        setError(true);
      }
    });
  };

  return (
    <div
      className={`group flex items-center bg-white p-1 rounded-xl border shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/20 w-full sm:w-auto
        ${
          error
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-slate-200 focus-within:border-indigo-500"
        }
      `}
    >
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {error ? (
            <AlertCircle size={14} className="text-rose-500" />
          ) : (
            <Search
              size={14}
              className="text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            />
          )}
        </div>
        <input
          type="text"
          value={txid}
          onChange={(e) => {
            setTxid(e.target.value.toUpperCase());
            if (error) setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Verify TXID..."
          className={`h-9 w-32 sm:w-40 pl-9 pr-2 bg-transparent border-none rounded-lg text-xs font-mono font-bold outline-none uppercase tracking-wider placeholder:normal-case placeholder:font-sans placeholder:tracking-normal transition-colors
            ${
              error
                ? "text-rose-600 placeholder:text-rose-300"
                : "text-slate-700 placeholder:text-slate-400"
            }
          `}
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={isPending || !txid}
        className="h-9 w-9 flex items-center justify-center bg-slate-900 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        title="Locate Voucher"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ArrowRight size={14} />
        )}
      </button>
    </div>
  );
}
