"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Loader2 } from "lucide-react";

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
    <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-2 bg-slate-50 rounded border border-slate-100 py-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
          As Of
        </span>
        <Calendar size={12} className="text-slate-400" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-700 outline-none uppercase"
        />
      </div>

      <button
        onClick={handleApply}
        disabled={isPending}
        className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 transition-all"
      >
        {isPending && <Loader2 size={10} className="animate-spin" />}
        Update
      </button>
    </div>
  );
}
