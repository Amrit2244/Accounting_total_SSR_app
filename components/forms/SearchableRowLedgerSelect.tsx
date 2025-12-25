"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Layers } from "lucide-react";

export default function SearchableRowLedgerSelect({
  rowIndex,
  row,
  ledgers,
  defaultType,
  updateRow,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredOptions = ledgers
    .filter((l: any) => {
      const name = l.name.toLowerCase();
      const group = l.group.name.toLowerCase();
      const query = (row.ledgerSearchTerm || "").toLowerCase();
      const isCashBank = group.includes("cash") || group.includes("bank");

      if (!name.includes(query)) return false;
      if (defaultType === "CONTRA") return isCashBank;
      if (defaultType === "PAYMENT")
        return row.type === "Dr" ? !isCashBank : isCashBank;
      if (defaultType === "RECEIPT")
        return row.type === "Cr" ? !isCashBank : isCashBank;
      if (defaultType === "JOURNAL") return !isCashBank;
      return true;
    })
    .slice(0, 15);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="relative w-full group" ref={searchRef}>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
        />
        <input
          type="text"
          value={row.ledgerSearchTerm || ""}
          onChange={(e) => {
            updateRow(rowIndex, "ledgerSearchTerm", e.target.value);
            setIsOpen(true);
            // Clear ID when typing new search to prevent mismatch
            if (row.ledgerId) updateRow(rowIndex, "ledgerId", "");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Select Ledger..."
          className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-normal"
        />
        <ChevronDown
          size={12}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-500 transition-colors"
        />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-[250px] bg-white border border-slate-200 rounded-xl shadow-2xl mt-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => {
                    updateRow(rowIndex, "ledgerId", l.id.toString());
                    updateRow(rowIndex, "ledgerSearchTerm", l.name);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group/item"
                >
                  <div className="text-xs font-bold text-slate-700 group-hover/item:text-indigo-700 transition-colors">
                    {l.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Layers
                      size={10}
                      className="text-slate-300 group-hover/item:text-indigo-300"
                    />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover/item:text-indigo-400">
                      {l.group.name}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <span className="text-xs text-slate-400 italic">
                  No ledger found
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
