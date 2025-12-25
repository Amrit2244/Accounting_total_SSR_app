"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Loader2, Filter, ArrowRight } from "lucide-react";

export default function BalanceSheetFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Default to today
  const defaultDate =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(defaultDate);

  const handleApply = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("date", date);
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Label Badge (Hidden on mobile for space) */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
        <Filter size={12} className="text-slate-400" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          As Of Date
        </span>
      </div>

      {/* Date Input Wrapper */}
      <div className="relative group flex-1 sm:flex-none">
        <Calendar
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 pl-9 pr-3 bg-white border border-transparent hover:bg-slate-50 focus:bg-white rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer uppercase tracking-wide w-full sm:w-auto"
        />
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 hidden sm:block" />

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={isPending}
        className="h-9 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 shadow-sm"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ArrowRight size={12} />
        )}
        <span>Apply Filter</span>
      </button>
    </div>
  );
}
