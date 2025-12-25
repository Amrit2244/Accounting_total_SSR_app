"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  BookOpen,
  ChevronDown,
  Check,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function LedgerSearchFilter({
  ledgers,
  defaultLedgerId,
  defaultFrom,
  defaultTo,
}: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  const selectedLedger = useMemo(
    () => ledgers.find((l: any) => l.id.toString() === defaultLedgerId),
    [ledgers, defaultLedgerId]
  );
  const filteredLedgers = useMemo(
    () =>
      ledgers.filter((l: any) =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ledgers, searchTerm]
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
      setIsOpen(false);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ledger Selector */}
      <div className="relative group" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between min-w-[200px] h-9 px-3 rounded-xl border transition-all cursor-pointer bg-white text-xs font-bold shadow-sm ${
            isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <BookOpen
              size={14}
              className={selectedLedger ? "text-indigo-600" : "text-slate-400"}
            />
            <span
              className={`truncate max-w-[150px] ${
                selectedLedger ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {selectedLedger ? selectedLedger.name : "Select Ledger..."}
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 w-64 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  placeholder="Search accounts..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredLedgers.length > 0 ? (
                filteredLedgers.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => updateFilter("ledgerId", l.id.toString())}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer rounded-lg transition-colors mb-0.5 ${
                      defaultLedgerId === l.id.toString()
                        ? "text-indigo-700 bg-indigo-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{l.name}</span>
                    {defaultLedgerId === l.id.toString() && (
                      <Check size={14} className="text-indigo-600" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  No accounts found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 h-9 shadow-sm hover:shadow-md transition-shadow group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors"
          />
          <input
            type="date"
            defaultValue={defaultFrom}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="pl-8 pr-1 py-1 bg-transparent text-[10px] font-bold uppercase outline-none w-24 text-slate-600 cursor-pointer focus:text-indigo-600 transition-colors"
          />
        </div>

        <ArrowRight size={12} className="text-slate-300 mx-1" />

        <input
          type="date"
          defaultValue={defaultTo}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="px-1 py-1 bg-transparent text-[10px] font-bold uppercase outline-none w-24 text-slate-600 cursor-pointer focus:text-indigo-600 transition-colors text-right"
        />
      </div>
    </div>
  );
}
