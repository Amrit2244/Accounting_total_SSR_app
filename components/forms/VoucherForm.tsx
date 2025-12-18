"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Calendar,
  FileText,
  Tag,
  User,
  Zap,
  FileUp,
  Paperclip,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
          className="w-full h-12 pl-10 pr-4 bg-slate-50 border-none rounded-xl font-bold"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 p-2 max-h-60 overflow-y-auto">
          {filteredOptions.map((l: any) => (
            <div
              key={l.id}
              onClick={() => {
                updateRow(rowIndex, "ledgerId", l.id.toString());
                updateRow(rowIndex, "ledgerSearchTerm", l.name);
                setIsOpen(false);
              }}
              className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
            >
              <span className="font-bold text-slate-700">{l.name}</span>
              <span className="text-[10px] uppercase text-slate-400 font-black bg-slate-100 px-2 py-1 rounded-md">
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
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01;

  if (state?.success)
    return (
      <div className="text-center p-20 bg-white rounded-[3rem] border border-slate-200 shadow-xl">
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Voucher Created
        </h2>
        <p className="text-slate-500 mb-8 font-medium">
          Ref: <span className="text-slate-900 font-bold">{state.code}</span>
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
          >
            New Entry
          </button>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="bg-slate-100 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
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
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
              Invoice Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
              Reference No
            </label>
            <input
              name="reference"
              type="text"
              placeholder="REF-001"
              className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
              Type
            </label>
            <div className="w-full h-14 flex items-center px-5 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase text-[10px] border border-blue-100">
              {defaultType}
            </div>
          </div>
        </div>

        {(defaultType === "SALES" || defaultType === "PURCHASE") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                Party A/c Name *
              </label>
              <select
                name="partyLedgerId"
                required
                className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl font-bold appearance-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Party...</option>
                {partyLedgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                {defaultType} Account *
              </label>
              <select
                name="salesPurchaseLedgerId"
                required
                className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl font-bold appearance-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {defaultType} Account...</option>
                {accountLedgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-900 text-white p-5 text-[10px] font-black uppercase tracking-widest">
          <div className="col-span-1 text-center">Dr/Cr</div>
          <div className="col-span-8 pl-4">Ledger Particulars</div>
          <div className="col-span-2 text-right pr-4">Amount (₹)</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-50">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 p-4 items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-1">
                <select
                  value={row.type}
                  onChange={(e) => updateRow(idx, "type", e.target.value)}
                  className={`w-full p-2 font-black rounded-xl text-[10px] border-none ${
                    row.type === "Dr"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
              <div className="col-span-8">
                <SearchableRowLedgerSelect
                  rowIndex={idx}
                  row={row}
                  ledgers={ledgers}
                  defaultType={defaultType}
                  updateRow={updateRow}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(idx, "amount", e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 text-right font-mono font-black bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-1 text-center">
                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
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
          className="w-full py-5 text-[10px] font-black uppercase text-blue-600 bg-slate-50 hover:bg-blue-50 border-t flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} /> Add Line Row
        </button>
      </div>

      <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 ml-2 tracking-widest">
          <FileUp size={14} className="text-blue-500" /> Proof of Entry
        </label>
        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 relative group">
          <input
            type="file"
            name="attachment"
            accept="image/*,.pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Paperclip size={20} />
            </div>
            <span className="text-sm font-bold text-slate-600">
              {selectedFile
                ? selectedFile.name
                : "Attach invoice or weight slip photo..."}
            </span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-6 bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white flex justify-between items-center border border-white/10">
        <div className="flex gap-12">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Debit
            </p>
            <p className="text-2xl font-black font-mono text-blue-400">
              ₹{totalDr.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Credit
            </p>
            <p className="text-2xl font-black font-mono text-orange-400">
              ₹{totalCr.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={!isBalanced || isPending}
          className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}{" "}
          {isPending ? "Saving..." : "Save Voucher"}
        </button>
      </div>
    </form>
  );
}
