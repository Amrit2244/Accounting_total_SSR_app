"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Calendar,
  Filter,
  Loader2,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export default function DaybookFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Default to today if not present
  const defaultFrom =
    searchParams.get("from") || new Date().toISOString().split("T")[0];
  const defaultTo =
    searchParams.get("to") || new Date().toISOString().split("T")[0];
  const defaultType = searchParams.get("type") || "ALL";

  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    type: defaultType,
  });

  const handleApply = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.type && filters.type !== "ALL")
        params.set("type", filters.type);

      router.push(`?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setFilters({
      from: new Date().toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
      type: "ALL",
    });
    router.push("?");
  };

  const hasActiveFilters =
    searchParams.has("type") ||
    searchParams.get("from") !== new Date().toISOString().split("T")[0] ||
    searchParams.get("to") !== new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
      {/* Date Range Group */}
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
        <Calendar
          size={14}
          className="text-slate-400 group-focus-within:text-indigo-500"
        />

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="bg-transparent text-xs font-bold text-slate-700 outline-none w-24 uppercase cursor-pointer"
        />

        <span className="text-slate-300 text-[9px] font-black px-1">TO</span>

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="bg-transparent text-xs font-bold text-slate-700 outline-none w-24 uppercase cursor-pointer"
        />
      </div>

      {/* Type Select */}
      <div className="relative group">
        <Filter
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer w-32 uppercase tracking-wide hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        >
          <option value="ALL">All Types</option>
          <option value="SALES">Sales</option>
          <option value="PURCHASE">Purchase</option>
          <option value="PAYMENT">Payment</option>
          <option value="RECEIPT">Receipt</option>
          <option value="JOURNAL">Journal</option>
          <option value="CONTRA">Contra</option>
        </select>
        <ChevronDown
          size={12}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={isPending}
        className="h-9 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <>
            <span>Filter</span>
            <ArrowRight size={12} />
          </>
        )}
      </button>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          title="Reset Filters"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
