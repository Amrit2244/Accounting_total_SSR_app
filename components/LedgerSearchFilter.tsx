"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, BookOpen, Calendar, ChevronDown } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Since we are updating on change for select, this button can trigger date updates
    const form = e.currentTarget as HTMLFormElement;
    const from = (form.elements.namedItem("from") as HTMLInputElement).value;
    const to = (form.elements.namedItem("to") as HTMLInputElement).value;

    // Explicitly update all filters on button submit (though date inputs update automatically via change)
    // This provides a redundant submit for browsers that don't trigger change on date field fully.
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-6 no-print"
    >
      {/* 1. Select Ledger */}
      <div className="space-y-1.5 w-64">
        <label className="block text-xs font-bold text-slate-500 uppercase">
          Select Ledger Account
        </label>
        <div className="relative">
          <BookOpen
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            name="ledgerId"
            value={defaultLedgerId || ""}
            onChange={(e) => updateFilter("ledgerId", e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer h-10 text-sm font-medium"
          >
            <option value="">-- Select Account --</option>
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {/* Custom Chevron */}
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
          />
        </div>
      </div>

      {/* 2. From Date */}
      <div className="space-y-1.5 w-36">
        <label className="block text-xs font-bold text-slate-500 uppercase">
          From Date
        </label>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            name="from"
            type="date"
            defaultValue={defaultFrom}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none h-10 text-sm font-medium"
          />
        </div>
      </div>

      {/* 3. To Date */}
      <div className="space-y-1.5 w-36">
        <label className="block text-xs font-bold text-slate-500 uppercase">
          To Date
        </label>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            name="to"
            type="date"
            defaultValue={defaultTo}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none h-10 text-sm font-medium"
          />
        </div>
      </div>

      {/* 4. Filter Button (Optional, since fields auto-update, but good for explicit filter) */}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 h-10 shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
      >
        <Search size={16} /> Filter
      </button>
    </form>
  );
}
