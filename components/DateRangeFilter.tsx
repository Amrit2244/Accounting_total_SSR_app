"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter } from "lucide-react";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize with URL params or empty
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-2 border-r border-slate-100">
        <Calendar size={14} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Filter
        </span>
      </div>

      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="text-xs border-none focus:ring-0 text-slate-700 font-medium p-1 w-28 bg-transparent"
        placeholder="From"
      />
      <span className="text-slate-300 text-xs">-</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="text-xs border-none focus:ring-0 text-slate-700 font-medium p-1 w-28 bg-transparent"
        placeholder="To"
      />

      <button
        onClick={handleApply}
        className="bg-slate-900 text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
        title="Apply Date Filter"
      >
        <Filter size={12} />
      </button>
    </div>
  );
}
