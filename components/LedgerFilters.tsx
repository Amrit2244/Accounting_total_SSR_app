"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import {
  Calendar,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
  XCircle,
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

  // Filter Ledgers Logic
  const filteredLedgers =
    searchQuery === ""
      ? ledgers
      : ledgers.filter((ledger) =>
          ledger.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
    <div className="flex flex-col md:flex-row items-center gap-3 p-1">
      {/* --- SMART SEARCH COMBOBOX --- */}
      <div className="relative w-full md:w-80 group" ref={wrapperRef}>
        <div
          className={`flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${
            isOpen ? "ring-2 ring-blue-500/20 border-blue-500" : ""
          }`}
          onClick={() => setIsOpen(true)}
        >
          <Search
            size={16}
            className={`text-slate-400 mr-2 ${isPending ? "hidden" : "block"}`}
          />
          {isPending && (
            <Loader2 size={16} className="text-blue-500 mr-2 animate-spin" />
          )}

          <input
            type="text"
            className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full placeholder:text-slate-400 uppercase placeholder:normal-case"
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
              className="ml-2 text-slate-400 hover:text-rose-500"
            >
              <XCircle size={16} />
            </button>
          ) : (
            <ChevronsUpDown size={16} className="ml-2 text-slate-400" />
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
            {filteredLedgers.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                No ledger found.
              </div>
            ) : (
              <ul className="py-1">
                {filteredLedgers.map((ledger) => (
                  <li
                    key={ledger.id}
                    onClick={() => handleSelect(ledger)}
                    className={`px-4 py-2.5 text-xs font-bold uppercase cursor-pointer flex items-center justify-between transition-colors ${
                      selectedId === ledger.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {ledger.name}
                    {selectedId === ledger.id && <Check size={14} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>

      {/* --- DATE RANGE PICKER --- */}
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
        <div className="relative flex items-center">
          <div className="absolute left-2.5 text-slate-400 pointer-events-none">
            <Calendar size={14} />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            onBlur={() => applyFilters()}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-600 pl-9 pr-2 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-36 uppercase transition-all shadow-sm"
          />
        </div>
        <span className="text-slate-300 font-black text-[10px] uppercase">
          To
        </span>
        <div className="relative flex items-center">
          <div className="absolute left-2.5 text-slate-400 pointer-events-none">
            <Calendar size={14} />
          </div>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            onBlur={() => applyFilters()}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-600 pl-9 pr-2 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-36 uppercase transition-all shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
