"use client";

import { useState, useActionState, useRef, useEffect, useMemo } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Search,
  Loader2,
  Paperclip,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

// State Interface
interface VoucherActionState {
  success?: boolean;
  message?: string;
  code?: string;
  txid?: string;
  id?: number;
  error?: string;
}

const initialState: VoucherActionState = {};

async function createVoucherWrapper(
  prevState: any,
  formData: FormData
): Promise<VoucherActionState> {
  const result = await createVoucher(prevState, formData);
  return result as VoucherActionState;
}

const SearchableRowLedgerSelect = ({
  rowIndex,
  row,
  ledgers,
  updateRow,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    return ledgers
      .filter((l: any) => {
        const name = l.name.toLowerCase();
        const query = (row.ledgerSearchTerm || "").toLowerCase();
        return name.includes(query);
      })
      .slice(0, 50);
  }, [ledgers, row.ledgerSearchTerm]);

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
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
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
          placeholder="Select Account..."
          className="w-full h-8 pl-8 pr-7 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 uppercase outline-none shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:normal-case placeholder:font-normal"
        />
        <ChevronDown
          size={10}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-500"
        />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 overflow-hidden animate-in fade-in zoom-in-95 origin-top-left">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => {
                    updateRow(rowIndex, "ledgerId", l.id.toString());
                    updateRow(rowIndex, "ledgerSearchTerm", l.name);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0 group/item"
                >
                  <span className="text-[10px] font-bold text-slate-700 uppercase truncate group-hover/item:text-indigo-700 transition-colors">
                    {l.name}
                  </span>
                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {l.group.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <AlertTriangle
                  size={16}
                  className="mx-auto text-amber-600 mb-1"
                />
                <span className="text-[9px] font-bold uppercase text-slate-400">
                  No ledgers found
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function VoucherForm({ companyId, ledgers, defaultType }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createVoucherWrapper,
    initialState
  );

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

  const updateRow = (idx: number, field: string, value: string) => {
    const n: any = [...rows];
    n[idx][field] = value;
    if (field === "amount" && idx === 0 && rows.length === 2)
      n[1].amount = value;
    setRows(n);
  };

  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((s, r: any) => s + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((s, r: any) => s + (parseFloat(r.amount) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

  useEffect(() => {
    if (state?.success)
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }, [state?.success]);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="bg-emerald-50 p-6 rounded-full mb-6 text-emerald-600 shadow-sm border border-emerald-100">
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            Submitted for Approval
          </h2>
          <div className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
            <ShieldAlert size={12} /> Status: Pending Verification
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full shadow-inner mb-8">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Voucher No
              </span>
              <span className="text-lg font-black text-slate-900">
                #{state.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Secure TXID
              </span>
              <span className="text-sm font-mono font-bold text-indigo-600 tracking-tight bg-white px-2 py-1 rounded border border-slate-200">
                {state.txid || "---"}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col h-full space-y-6 font-sans p-1"
    >
      {/* HIDDEN INPUTS - MATCHING THE SERVER ACTION EXPECTATIONS */}
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="totalAmount" value={totalDr.toString()} />
      <input
        type="hidden"
        name="ledgerEntries"
        value={JSON.stringify(
          rows.map((r) => ({
            ledgerId: r.ledgerId,
            // In your server logic: negative for Dr, positive for Cr
            amount:
              r.type === "Dr"
                ? -Math.abs(parseFloat(r.amount))
                : Math.abs(parseFloat(r.amount)),
          }))
        )}
      />

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Posting Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Reference No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="OPTIONAL"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:font-normal"
          />
        </div>
        <div className="relative group md:col-start-4">
          <label className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:text-indigo-600 text-slate-500 text-[10px] font-black uppercase tracking-wide transition-all shadow-sm">
            <Paperclip size={14} />
            <span>Attach Proof</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      {/* GRID */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-900 text-white p-3 text-[10px] font-black uppercase tracking-widest">
          <div className="col-span-2 text-center">Type</div>
          <div className="col-span-8 pl-2">
            Particulars (Smart Filter Active)
          </div>
          <div className="col-span-2 text-right pr-4">Amount</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50 min-h-[200px]">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 items-center px-2 py-1 group hover:bg-white transition-all rounded-lg relative"
            >
              <select
                value={row.type}
                onChange={(e) => updateRow(idx, "type", e.target.value)}
                className={`col-span-2 h-8 rounded-lg text-[10px] font-black pl-2 outline-none cursor-pointer border ${
                  row.type === "Dr"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : "bg-orange-50 text-orange-700 border-orange-100"
                }`}
              >
                <option value="Dr">Dr</option>
                <option value="Cr">Cr</option>
              </select>
              <div className="col-span-8">
                <SearchableRowLedgerSelect
                  rowIndex={idx}
                  row={row}
                  ledgers={ledgers}
                  updateRow={updateRow}
                />
              </div>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(idx, "amount", e.target.value)}
                className="col-span-2 h-8 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
              {rows.length > 2 && (
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  className="absolute -right-1 opacity-0 group-hover:opacity-100 p-1 bg-rose-50 text-rose-500 rounded hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              { ledgerId: "", type: "Dr", amount: "", ledgerSearchTerm: "" },
            ])
          }
          className="w-full py-3 bg-white text-[10px] font-black text-slate-500 border-t border-slate-200 flex justify-center items-center gap-2 hover:text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-widest"
        >
          <Plus size={10} /> Add Entry Row
        </button>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <textarea
          name="narration"
          rows={3}
          className="w-full md:flex-1 p-4 border border-slate-200 rounded-2xl text-xs font-medium resize-none shadow-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
          placeholder="Enter narration..."
        />
        <div className="w-full md:w-72 bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col text-[10px] font-bold border-b border-white/10 pb-3 space-y-1.5 relative z-10">
            <div className="flex justify-between text-indigo-300">
              <span>Dr Total:</span>{" "}
              <span className="font-mono text-white tracking-wide">
                {totalDr.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-orange-300">
              <span>Cr Total:</span>{" "}
              <span className="font-mono text-white tracking-wide">
                {totalCr.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-end relative z-10 pt-2">
            {!isBalanced ? (
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-1 rounded border border-rose-500/30">
                Unbalanced: {(totalDr - totalCr).toFixed(2)}
              </div>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> Balanced
              </div>
            )}
            <button
              type="submit"
              disabled={!isBalanced || isPending}
              className="h-9 px-4 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              {isPending ? "..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
