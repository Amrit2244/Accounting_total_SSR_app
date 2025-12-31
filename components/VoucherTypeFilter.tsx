"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

export default function VoucherTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "ALL";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;

    if (value === "ALL") {
      params.delete("type");
    } else {
      params.set("type", value);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <Filter size={14} />
      </div>
      <select
        value={currentType}
        onChange={handleChange}
        className="h-9 pl-8 pr-8 text-sm font-medium bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-300 transition-colors appearance-none cursor-pointer uppercase tracking-wide text-slate-700"
      >
        <option value="ALL">All Vouchers</option>
        <option value="SALES">Sales</option>
        <option value="PURCHASE">Purchase</option>
        <option value="PAYMENT">Payment</option>
        <option value="RECEIPT">Receipt</option>
        <option value="CONTRA">Contra</option>
        <option value="JOURNAL">Journal</option>
      </select>
      {/* Custom dropdown arrow to match design */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
