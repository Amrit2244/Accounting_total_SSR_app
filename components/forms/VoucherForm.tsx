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
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

// ✅ FIX 1: State Interface
interface VoucherActionState {
  success?: boolean;
  message?: string;
  code?: string;
  txid?: string;
  id?: number;
  error?: string;
}

// ✅ FIX 2: Initial State
const initialState: VoucherActionState = {};

// ✅ FIX 3: Wrapper
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
  defaultType,
  updateRow,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ✅ SMART LEDGER FILTERING LOGIC
  const filteredOptions = useMemo(() => {
    return ledgers
      .filter((l: any) => {
        const name = l.name.toLowerCase();
        const group = l.group.name.toLowerCase();
        const query = (row.ledgerSearchTerm || "").toLowerCase();

        // Identify Bank/Cash groups
        const isCashBank = group.includes("cash") || group.includes("bank");

        // 1. Basic Search Filter
        if (!name.includes(query)) return false;

        // 2. Rule-based Logic
        switch (defaultType) {
          case "CONTRA":
            return isCashBank; // Both Dr/Cr must be Cash/Bank
          case "PAYMENT":
            return row.type === "Dr" ? !isCashBank : isCashBank; // Dr: Expense/Party, Cr: Cash/Bank
          case "RECEIPT":
            return row.type === "Dr" ? isCashBank : !isCashBank; // Dr: Cash/Bank, Cr: Income/Party
          case "JOURNAL":
            return !isCashBank; // Both Dr/Cr must be Non-Cash/Bank
          default:
            return true;
        }
      })
      .slice(0, 15);
  }, [ledgers, row.ledgerSearchTerm, row.type, defaultType]);

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
          placeholder="Select Account..."
          className="w-full h-8 pl-7 pr-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 uppercase outline-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-1 max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((l: any) => (
              <div
                key={l.id}
                onClick={() => {
                  updateRow(rowIndex, "ledgerId", l.id.toString());
                  updateRow(rowIndex, "ledgerSearchTerm", l.name);
                  setIsOpen(false);
                }}
                className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-[10px] font-bold text-slate-700 uppercase truncate">
                  {l.name}
                </span>
                <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 text-center">
              <div className="flex flex-col items-center gap-1 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-[9px] font-bold uppercase tracking-tight">
                  No valid ledgers found
                </span>
              </div>
              <p className="text-[8px] text-slate-400 mt-1 leading-tight">
                Check if you have created Cash/Bank ledgers for this company.
              </p>
            </div>
          )}
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

  // ✅ AUTO-BALANCING LOGIC
  const updateRow = (idx: number, field: string, value: string) => {
    const n: any = [...rows];
    n[idx][field] = value;

    // Logic: If updating amount in row 0, automatically update row 1 to match
    if (field === "amount" && idx === 0 && rows.length === 2) {
      n[1].amount = value;
    }

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
    if (state?.success) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [state?.success]);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl shadow-sm animate-in zoom-in-95 duration-300">
        <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
          <Clock size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">
          Submitted for Approval
        </h2>
        <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
          <ShieldAlert size={12} /> Status: Pending Verification
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-8 w-full max-w-xs shadow-md text-left">
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Voucher No
            </span>
            <span className="text-xl font-black text-slate-900">
              #{state.code}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secure TXID
            </span>
            <span className="text-xl font-mono font-black text-blue-600 tracking-tight">
              {state.txid || "---"}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg text-xs uppercase tracking-wide"
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
      className="flex flex-col h-full space-y-4 font-sans"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-9 px-3 border rounded-lg text-xs font-bold text-slate-700"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            Ref No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="OPTIONAL"
            className="w-full h-9 px-3 border rounded-lg text-xs font-bold"
          />
        </div>
        <div className="relative group">
          <label className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wide transition-all">
            <Paperclip size={12} />
            <span>Proof</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-100 p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
          <div className="col-span-2 text-center">Type</div>
          <div className="col-span-8 pl-2">
            Particulars (Smart Filter Active)
          </div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1 group"
            >
              <select
                value={row.type}
                onChange={(e) => updateRow(idx, "type", e.target.value)}
                className={`col-span-2 h-8 rounded-lg text-[10px] font-black pl-2 outline-none transition-colors ${
                  row.type === "Dr"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
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
                  defaultType={defaultType}
                  updateRow={updateRow}
                />
              </div>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(idx, "amount", e.target.value)}
                className="col-span-2 h-8 px-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {rows.length > 2 && (
                  <Trash2
                    size={14}
                    className="text-red-400 cursor-pointer hover:scale-110"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  />
                )}
              </div>
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
          className="w-full py-2 bg-white text-[10px] font-black text-blue-600 border-t border-slate-100 flex justify-center items-center gap-1 hover:bg-slate-50 transition-colors uppercase tracking-wide"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <textarea
          name="narration"
          rows={2}
          className="flex-1 p-3 border border-slate-300 rounded-xl text-xs resize-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Narration..."
        />
        <div className="w-64 bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between h-32 shadow-xl">
          <div className="flex flex-col text-[10px] font-bold border-b border-white/10 pb-2 space-y-1">
            <div className="flex justify-between text-blue-300">
              <span>Dr Total:</span>{" "}
              <span className="font-mono text-white">{totalDr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-orange-300">
              <span>Cr Total:</span>{" "}
              <span className="font-mono text-white">{totalCr.toFixed(2)}</span>
            </div>
            {!isBalanced && (
              <span className="text-rose-400 mt-1 text-right block bg-rose-900/30 px-2 py-0.5 rounded">
                Diff: {(totalDr - totalCr).toFixed(2)}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isBalanced || isPending}
            className="w-full h-9 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            {isPending ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </form>
  );
}
