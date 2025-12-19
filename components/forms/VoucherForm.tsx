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
  Search,
  Loader2,
  IndianRupee,
  Paperclip,
} from "lucide-react";
import Link from "next/link";

// ✅ FIX 1: State Interface
interface VoucherActionState {
  success?: boolean;
  message?: string;
  code?: string;
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
          className="w-full h-8 pl-7 pr-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 uppercase outline-none shadow-sm"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-1 max-h-48 overflow-y-auto">
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
};

export default function VoucherForm({ companyId, ledgers, defaultType }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createVoucherWrapper,
    initialState
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

  const partyLedgers = ledgers.filter(
    (l: any) =>
      l.group.name.toLowerCase().includes("debtors") ||
      l.group.name.toLowerCase().includes("creditors")
  );
  const accountLedgers = ledgers.filter((l: any) =>
    l.group.name
      .toLowerCase()
      .includes(
        defaultType === "SALES" ? "sales accounts" : "purchase accounts"
      )
  );

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

  if (state?.success)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-xl border border-slate-200">
        <CheckCircle size={32} className="text-emerald-500 mb-4" />
        <h2 className="text-lg font-black uppercase tracking-tight">
          Voucher Posted
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6 uppercase">
          Ref ID: {state.code}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md"
        >
          New Entry
        </button>
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

      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-9 px-3 border rounded-lg text-xs font-bold"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400">
            Ref No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="OPTIONAL"
            className="w-full h-9 px-3 border rounded-lg text-xs font-bold"
          />
        </div>
        {(defaultType === "SALES" || defaultType === "PURCHASE") && (
          <>
            <select
              name="partyLedgerId"
              className="h-9 px-3 border rounded-lg text-xs font-bold"
              required
            >
              <option value="">Party...</option>
              {partyLedgers.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              name="salesPurchaseLedgerId"
              className="h-9 px-3 border rounded-lg text-xs font-bold"
              required
            >
              <option value="">Account...</option>
              {accountLedgers.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="bg-white border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-100 p-2 text-[9px] font-black uppercase text-slate-500">
          <div className="col-span-1 text-center">Type</div>
          <div className="col-span-8 pl-2">Particulars</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1"
            >
              <select
                value={row.type}
                onChange={(e) => updateRow(idx, "type", e.target.value)}
                className={`col-span-1 h-8 rounded-lg text-[10px] font-black ${
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
                className="col-span-2 h-8 px-2 border rounded-lg text-xs font-mono font-bold text-right"
                required
              />
              {rows.length > 2 && (
                <Trash2
                  size={14}
                  className="text-slate-300 hover:text-red-500 cursor-pointer"
                  onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                />
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
          className="w-full py-2 bg-white text-[10px] font-black text-blue-600 border-t flex justify-center items-center gap-1"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <textarea
          name="narration"
          rows={2}
          className="flex-1 p-3 border rounded-xl text-xs resize-none shadow-sm"
          placeholder="Narration..."
        />
        <div className="w-60 bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between h-32">
          <div className="flex flex-col text-[10px] font-bold border-b border-white/10 pb-2">
            <span>Dr: {totalDr.toFixed(2)}</span>
            <span>Cr: {totalCr.toFixed(2)}</span>
            {!isBalanced && (
              <span className="text-rose-400 mt-1">
                Diff: {(totalDr - totalCr).toFixed(2)}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isBalanced || isPending}
            className="w-full h-9 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}{" "}
            {isPending ? "Saving..." : "Save Voucher"}
          </button>
        </div>
      </div>
    </form>
  );
}
