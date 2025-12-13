"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  ledgers: { id: number; name: string }[];
  defaultLedgerId?: string;
  defaultFrom: string;
  defaultTo: string;
};

export default function LedgerSearchFilter({
  ledgers,
  defaultLedgerId,
  defaultFrom,
  defaultTo,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 no-print flex flex-wrap gap-4 items-end">
      {/* ✅ FIXED WIDTH: w-64 limits the size */}
      <div className="w-64">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
          Select Ledger Account
        </label>
        <select
          value={defaultLedgerId || ""}
          onChange={(e) => updateFilter("ledgerId", e.target.value)}
          className="w-full p-2 border border-slate-300 rounded text-xs font-bold outline-none focus:border-blue-500 cursor-pointer h-9 bg-white"
        >
          <option value="">-- Select --</option>
          {ledgers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-32">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
          From Date
        </label>
        <input
          type="date"
          value={defaultFrom}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="w-full p-2 border border-slate-300 rounded text-xs font-bold outline-none focus:border-blue-500 cursor-pointer h-9"
        />
      </div>

      <div className="w-32">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
          To Date
        </label>
        <input
          type="date"
          value={defaultTo}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="w-full p-2 border border-slate-300 rounded text-xs font-bold outline-none focus:border-blue-500 cursor-pointer h-9"
        />
      </div>
    </div>
  );
}
