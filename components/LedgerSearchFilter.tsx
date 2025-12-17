"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  BookOpen,
  ChevronDown,
  Check,
  X,
  Calendar,
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLedger = useMemo(
    () => ledgers.find((l: any) => l.id.toString() === defaultLedgerId),
    [ledgers, defaultLedgerId]
  );

  const filteredLedgers = useMemo(() => {
    return ledgers.filter((l: any) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledgers, searchTerm]);

  // AUTO-REDIRECT ON SELECT
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
      setIsOpen(false); // Close dropdown on select
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex items-center gap-3">
      {/* SMART DROPDOWN */}
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-64 h-11 px-4 rounded-xl border transition-all cursor-pointer bg-slate-50/50 hover:bg-white ${
            isOpen
              ? "border-slate-900 ring-4 ring-slate-100"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            <BookOpen
              size={16}
              className={selectedLedger ? "text-blue-600" : "text-slate-400"}
            />
            <span
              className={`text-xs font-bold truncate ${
                selectedLedger ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {selectedLedger ? selectedLedger.name : "Select Ledger..."}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute top-full right-0 w-80 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  placeholder="Type to search..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredLedgers.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => updateFilter("ledgerId", l.id.toString())}
                  className={`flex items-center justify-between px-4 py-3 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors ${
                    defaultLedgerId === l.id.toString()
                      ? "text-blue-600 bg-blue-50/50"
                      : "text-slate-600"
                  }`}
                >
                  {l.name}
                  {defaultLedgerId === l.id.toString() && <Check size={14} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DATE RANGE */}
      <div className="flex items-center bg-slate-50/50 border border-slate-200 rounded-xl px-2 h-11">
        <input
          type="date"
          defaultValue={defaultFrom}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="bg-transparent text-[10px] font-black uppercase outline-none px-2 cursor-pointer"
        />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <input
          type="date"
          defaultValue={defaultTo}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="bg-transparent text-[10px] font-black uppercase outline-none px-2 cursor-pointer"
        />
      </div>
    </div>
  );
}
