"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Calendar,
  Tag,
  FileUp,
  Paperclip,
  Search,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";

// --- SUB-COMPONENT: COMPACT SEARCHABLE SELECT ---
const SearchableRowLedgerSelect = ({
  rowIndex,
  row,
  ledgers,
  defaultType,
  updateRow,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredOptions = ledgers
    .filter((l: any) => {
      const name = l.name.toLowerCase();
      const group = l.group.name.toLowerCase();
      const query = (row.ledgerSearchTerm || "").toLowerCase();
      const isCashBank = group.includes("cash") || group.includes("bank");

      if (!name.includes(query)) return false;

      // ACCOUNTING RULES
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
          className="w-full h-8 pl-7 pr-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:normal-case shadow-sm"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-1 max-h-48 overflow-y-auto custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((l: any) => (
              <div
                key={l.id}
                onClick={() => {
                  updateRow(rowIndex, "ledgerId", l.id.toString());
                  updateRow(rowIndex, "ledgerSearchTerm", l.name);
                  setIsOpen(false);
                }}
                className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex justify-between items-center transition-colors group"
              >
                <span className="text-[10px] font-bold text-slate-700 uppercase truncate group-hover:text-blue-700">
                  {l.name}
                </span>
                <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-600">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-2 text-[10px] text-slate-400 italic text-center">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function VoucherForm({ companyId, ledgers, defaultType }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createVoucher as any,
    undefined
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [rows, setRows] = useState(
    defaultType === "RECEIPT"
      ? [
          {
            ledgerId: "",
            type: "Cr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
          {
            ledgerId: "",
            type: "Dr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
        ]
      : [
          {
            ledgerId: "",
            type: "Dr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
          {
            ledgerId: "",
            type: "Cr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
        ]
  );

  const partyLedgers = ledgers.filter((l: any) => {
    const group = l.group.name.toLowerCase();
    return group.includes("debtors") || group.includes("creditors");
  });

  const accountLedgers = ledgers.filter((l: any) => {
    const group = l.group.name.toLowerCase();
    return defaultType === "SALES"
      ? group.includes("sales accounts")
      : group.includes("purchase accounts");
  });

  const updateRow = (idx: number, field: string, value: string) => {
    const n = [...rows];
    (n[idx] as any)[field] = value;
    setRows(n);
  };

  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

  // SUCCESS STATE
  if (state?.success)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
          Voucher Posted
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wide">
          Ref ID: <span className="text-slate-900">{state.code}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
          >
            New Entry
          </button>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Daybook
          </Link>
        </div>
      </div>
    );

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col h-full space-y-4 font-sans"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {/* --- HEADER INPUTS (Compact Grid) --- */}
      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
              <Calendar size={10} /> Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm cursor-pointer"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
              <Tag size={10} /> Reference No
            </label>
            <input
              name="reference"
              type="text"
              placeholder="OPTIONAL"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm uppercase placeholder:normal-case"
            />
          </div>

          {defaultType === "SALES" || defaultType === "PURCHASE" ? (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Party A/c
                </label>
                <select
                  name="partyLedgerId"
                  required
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="">Select Party...</option>
                  {partyLedgers.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  {defaultType} A/c
                </label>
                <select
                  name="salesPurchaseLedgerId"
                  required
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="">Select Account...</option>
                  {accountLedgers.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Voucher Type
              </label>
              <div className="w-full h-9 flex items-center px-3 bg-slate-100 text-slate-500 rounded-lg font-black uppercase text-[10px] border border-slate-200 select-none cursor-not-allowed">
                {defaultType} Entry
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
        {/* Table Head */}
        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 px-3 py-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
          <div className="col-span-1 text-center">Type</div>
          <div className="col-span-8 pl-2">Particulars (Ledger)</div>
          <div className="col-span-2 text-right pr-2">Amount (₹)</div>
          <div className="col-span-1 text-center">Act</div>
        </div>

        {/* Scrollable Rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-1 space-y-1">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors group border border-transparent hover:border-slate-100"
            >
              {/* Type Select */}
              <div className="col-span-1">
                <select
                  value={row.type}
                  onChange={(e) => updateRow(idx, "type", e.target.value)}
                  className={`w-full h-8 px-1 rounded-lg text-[10px] font-black border-none outline-none cursor-pointer text-center ${
                    row.type === "Dr"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>

              {/* Ledger Search */}
              <div className="col-span-8">
                <SearchableRowLedgerSelect
                  rowIndex={idx}
                  row={row}
                  ledgers={ledgers}
                  defaultType={defaultType}
                  updateRow={updateRow}
                />
              </div>

              {/* Amount Input */}
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(idx, "amount", e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
                  required
                />
              </div>

              {/* Delete Action */}
              <div className="col-span-1 text-center">
                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              { ledgerId: "", type: "Dr", amount: "", ledgerSearchTerm: "" },
            ])
          }
          className="w-full py-2 bg-white hover:bg-slate-50 text-[10px] font-black uppercase text-blue-600 border-t border-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add Ledger Line
        </button>
      </div>

      {/* --- FOOTER & TOTALS --- */}
      <div className="flex gap-4 items-start">
        {/* Narration & Attachment */}
        <div className="flex-1 space-y-2">
          <textarea
            name="narration"
            rows={2}
            className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none bg-white placeholder:text-slate-400"
            placeholder="Enter narration here..."
          ></textarea>

          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <input
                type="file"
                name="attachment"
                accept="image/*,.pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg group-hover:border-blue-400 transition-colors">
                <Paperclip
                  size={14}
                  className="text-slate-400 group-hover:text-blue-500"
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px] group-hover:text-blue-600">
                  {selectedFile ? selectedFile.name : "Attach Proof"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals Card */}
        <div className="w-60 bg-slate-900 text-white p-4 rounded-xl shadow-lg flex flex-col justify-between h-32 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 pb-2">
              <span>
                Debit: <span className="text-white">{totalDr.toFixed(2)}</span>
              </span>
              <span>
                Credit: <span className="text-white">{totalCr.toFixed(2)}</span>
              </span>
            </div>
            {!isBalanced && (
              <div className="text-[9px] font-black text-rose-400 text-center animate-pulse uppercase">
                Diff: {(totalDr - totalCr).toFixed(2)}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isBalanced || isPending}
            className="w-full h-9 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            {isPending ? "Saving..." : "Save Voucher"}
          </button>
        </div>
      </div>
    </form>
  );
}
