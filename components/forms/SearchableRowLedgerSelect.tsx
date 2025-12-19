"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

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
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={row.ledgerSearchTerm || ""}
          onChange={(e) => {
            updateRow(rowIndex, "ledgerSearchTerm", e.target.value);
            setIsOpen(true);
            if (row.ledgerId) updateRow(rowIndex, "ledgerId", "");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Ledger..."
          className="w-full h-8 pl-7 pr-2 bg-slate-50 border-none rounded-lg text-[11px] font-bold text-slate-800 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:normal-case"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-1 max-h-48 overflow-y-auto custom-scrollbar">
          {filteredOptions.map((l: any) => (
            <div
              key={l.id}
              onClick={() => {
                updateRow(rowIndex, "ledgerId", l.id.toString());
                updateRow(rowIndex, "ledgerSearchTerm", l.name);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex justify-between items-center transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-700 uppercase truncate">
                {l.name}
              </span>
              <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {l.group.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
