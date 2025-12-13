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
      alert("Please enter a valid 5-digit transaction code");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all"
    >
      <div className="pl-3 text-slate-400">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Search size={16} />
        )}
      </div>
      <input
        type="text"
        placeholder="Enter 5-Digit ID"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))} // Numbers only, max 5
        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-32 placeholder:font-normal"
      />
      <button
        type="submit"
        disabled={code.length !== 5 || loading}
        className="bg-[#003366] text-white p-1.5 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowRight size={14} />
      </button>
    </form>
  );
}
