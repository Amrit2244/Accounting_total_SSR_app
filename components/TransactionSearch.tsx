"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";

export default function TransactionSearch({
  companyId,
}: {
  companyId: number;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 5) {
      setLoading(true);
      // Redirects to the Verify Page
      router.push(`/companies/${companyId}/vouchers/verify/${code}`);
    } else {
      // Optional: Add toast or inline error here instead of alert in production
      alert("Please enter a valid 5-digit transaction code");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all hover:shadow-md group w-full sm:w-auto"
    >
      <div className="pl-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Search size={16} />
        )}
      </div>

      <input
        type="text"
        placeholder="ENTER ID"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))} // Numbers only, max 5
        className="bg-transparent border-none outline-none text-xs font-mono font-bold text-slate-900 w-24 placeholder:text-slate-400 placeholder:font-sans placeholder:font-bold placeholder:tracking-wider tracking-[0.2em] text-center"
      />

      <button
        type="submit"
        disabled={code.length !== 5 || loading}
        className="bg-slate-900 hover:bg-indigo-600 text-white h-8 w-8 flex items-center justify-center rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ArrowRight size={14} />
      </button>
    </form>
  );
}
