"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Filter, Loader2, X } from "lucide-react";

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

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
      {/* Date Range Inputs */}
      <div className="flex items-center gap-2 px-2">
        <Calendar size={12} className="text-slate-400" />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-20 uppercase"
        />
        <span className="text-slate-300 text-[10px] font-black">TO</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-20 uppercase"
        />
      </div>

      <div className="h-4 w-px bg-slate-300" />

      {/* Voucher Type Select */}
      <div className="relative">
        <Filter
          size={12}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="pl-7 pr-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer w-28 uppercase"
        >
          <option value="ALL">All Vouchers</option>
          <option value="SALES">Sales</option>
          <option value="PURCHASE">Purchase</option>
          <option value="PAYMENT">Payment</option>
          <option value="RECEIPT">Receipt</option>
          <option value="JOURNAL">Journal</option>
          <option value="CONTRA">Contra</option>
        </select>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleApply}
        disabled={isPending}
        className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 min-w-[60px] flex justify-center"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : "GO"}
      </button>

      {(searchParams.has("type") || searchParams.has("from")) && (
        <button
          onClick={handleReset}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
          title="Reset Filters"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
