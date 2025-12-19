"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default to current month if no params
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(searchParams.get("from") || defaultStart);
  const [to, setTo] = useState(searchParams.get("to") || defaultEnd);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.set("from", from);
    params.set("to", to);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="text-[10px] font-bold uppercase text-slate-600 bg-slate-50 border-none rounded px-2 py-1 focus:ring-0"
      />
      <span className="text-[10px] text-slate-400 font-black">TO</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="text-[10px] font-bold uppercase text-slate-600 bg-slate-50 border-none rounded px-2 py-1 focus:ring-0"
      />
      <button
        onClick={applyFilter}
        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <Search size={12} />
      </button>
    </div>
  );
}
