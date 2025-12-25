"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false); // Simple local loading state

  // Initialize with URL params or empty
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  const handleApply = () => {
    setIsPending(true);
    const params = new URLSearchParams(searchParams.toString());

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    // Push and reset loading after a short delay (simulated or real navigation time)
    router.push(`?${params.toString()}`);
    setTimeout(() => setIsPending(false), 500);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-1 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group">
      {/* Label / Icon */}
      <div className="flex items-center gap-2 pl-3 pr-2 border-r border-slate-100">
        <Calendar
          size={14}
          className="text-slate-400 group-hover:text-indigo-500 transition-colors"
        />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
          Period
        </span>
      </div>

      {/* Date Inputs Wrapper */}
      <div className="flex items-center gap-2 px-1">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 pointer-events-none uppercase">
            From
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 pl-10 pr-2 bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer w-28 uppercase"
          />
        </div>

        <ArrowRight size={12} className="text-slate-300" />

        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 pointer-events-none uppercase">
            To
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 pl-8 pr-2 bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer w-28 uppercase"
          />
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={isPending}
        className="h-8 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 ml-1 shadow-sm"
        title="Apply Date Filter"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : "Go"}
      </button>
    </div>
  );
}
