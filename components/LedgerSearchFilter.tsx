"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Search, BookOpen, ChevronDown, Check } from "lucide-react";

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
    <div className="flex items-center gap-2">
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-56 h-8 px-3 rounded-lg border transition-all cursor-pointer bg-white text-[10px] font-bold uppercase ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <BookOpen
              size={12}
              className={selectedLedger ? "text-blue-600" : "text-slate-400"}
            />
            <span
              className={selectedLedger ? "text-slate-900" : "text-slate-400"}
            >
              {selectedLedger ? selectedLedger.name : "Select Ledger..."}
            </span>
          </div>
          <ChevronDown size={12} className="text-slate-400" />
        </div>

        {isOpen && (
          <div className="absolute top-full right-0 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  placeholder="Search..."
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-blue-500 font-bold uppercase"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredLedgers.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => updateFilter("ledgerId", l.id.toString())}
                  className={`flex items-center justify-between px-3 py-2 text-[10px] font-bold cursor-pointer hover:bg-blue-50 transition-colors uppercase ${
                    defaultLedgerId === l.id.toString()
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-600"
                  }`}
                >
                  {l.name}
                  {defaultLedgerId === l.id.toString() && <Check size={12} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 h-8 shadow-sm">
        <input
          type="date"
          defaultValue={defaultFrom}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="bg-transparent text-[9px] font-bold uppercase outline-none w-20 text-slate-600 cursor-pointer"
        />
        <span className="text-slate-300 mx-1">/</span>
        <input
          type="date"
          defaultValue={defaultTo}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="bg-transparent text-[9px] font-bold uppercase outline-none w-20 text-slate-600 cursor-pointer"
        />
      </div>
    </div>
  );
}
