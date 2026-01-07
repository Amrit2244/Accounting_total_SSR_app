"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface Ledger {
  id: number;
  name: string;
}

export default function LedgerFilters({
  ledgers,
  selectedId,
  fromDate,
  toDate,
}: {
  ledgers: Ledger[];
  selectedId: number | null;
  fromDate: string;
  toDate: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Date State
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);

  // Smart Search State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize search query with selected ledger name if present
  useEffect(() => {
    if (selectedId) {
      const selected = ledgers.find((l) => l.id === selectedId);
      if (selected) setSearchQuery(selected.name);
    }
  }, [selectedId, ledgers]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset query to selected ledger name on close if not selecting a new one
        if (selectedId) {
          const selected = ledgers.find((l) => l.id === selectedId);
          if (selected && searchQuery !== selected.name)
            setSearchQuery(selected.name);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedId, ledgers, searchQuery]);

  // ✅ UPDATED: Filter Ledgers Logic (Space-Insensitive)
  const filteredLedgers = useMemo(() => {
    if (!searchQuery) return ledgers;

    // 1. Normalize Query: Lowercase + Remove all spaces
    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, "");

    return ledgers.filter((ledger) => {
      // 2. Normalize Data: Lowercase + Remove all spaces
      const normalizedName = ledger.name.toLowerCase().replace(/\s+/g, "");

      // 3. Check for inclusion
      return normalizedName.includes(normalizedQuery);
    });
  }, [ledgers, searchQuery]);

  // Apply Filters to URL
  const applyFilters = (newLedgerId?: number | null) => {
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);

      // Handle Ledger ID
      if (newLedgerId !== undefined) {
        if (newLedgerId) params.set("ledgerId", newLedgerId.toString());
        else params.delete("ledgerId");
      }

      // Handle Dates
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      router.push(`?${params.toString()}`);
    });
  };

  const handleSelect = (ledger: Ledger) => {
    setSearchQuery(ledger.name);
    setIsOpen(false);
    applyFilters(ledger.id);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery("");
    setIsOpen(false);
    applyFilters(null);
  };

  return (
    <div className="flex flex-col lg:flex-row items-end gap-4 p-1">
      {/* --- SMART SEARCH COMBOBOX --- */}
      <div className="relative w-full lg:w-96 group" ref={wrapperRef}>
        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 hidden lg:block tracking-widest ml-1">
          Filter Account
        </label>
        <div
          className={`flex items-center bg-white border border-slate-200 rounded-xl px-3 h-11 shadow-sm transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500/20 group-focus-within:border-indigo-500 group-focus-within:shadow-md cursor-text ${
            isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""
          }`}
          onClick={() => setIsOpen(true)}
        >
          <Search
            size={16}
            className={`text-slate-400 mr-3 group-focus-within:text-indigo-500 transition-colors ${
              isPending ? "hidden" : "block"
            }`}
          />
          {isPending && (
            <Loader2 size={16} className="text-indigo-500 mr-3 animate-spin" />
          )}

          <input
            type="text"
            className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full placeholder:text-slate-400 placeholder:font-medium transition-all"
            placeholder="Search Ledger Account..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />

          {selectedId ? (
            <button
              onClick={clearSelection}
              className="ml-2 text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-rose-50"
            >
              <XCircle size={16} />
            </button>
          ) : (
            <ChevronsUpDown size={16} className="ml-2 text-slate-300" />
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Select Account
            </div>
            {filteredLedgers.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-400">
                No ledger found matching "{searchQuery}"
              </div>
            ) : (
              <ul className="py-1">
                {filteredLedgers.map((ledger) => (
                  <li
                    key={ledger.id}
                    onClick={() => handleSelect(ledger)}
                    className={`px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors group ${
                      selectedId === ledger.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{ledger.name}</span>
                    {selectedId === ledger.id && (
                      <Check size={14} className="text-indigo-600" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* --- DATE RANGE PICKER --- */}
      <div className="flex-1 w-full lg:w-auto">
        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 hidden lg:block tracking-widest ml-1">
          Date Range
        </label>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group-focus-within:border-indigo-200 group-focus-within:ring-2 group-focus-within:ring-indigo-100 h-11">
          <div className="relative flex-1">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-full h-9 pl-9 pr-2 bg-transparent rounded-lg text-xs font-bold text-slate-700 outline-none focus:bg-slate-50 transition-colors uppercase cursor-pointer"
            />
          </div>

          <ArrowRight size={14} className="text-slate-300" />

          <div className="relative flex-1">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-full h-9 pl-9 pr-2 bg-transparent rounded-lg text-xs font-bold text-slate-700 outline-none focus:bg-slate-50 transition-colors uppercase cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
