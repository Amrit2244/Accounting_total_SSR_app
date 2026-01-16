"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { updateVoucher } from "@/app/actions/voucher";

interface LedgerEntry {
  ledgerId: string; // Changed to string to match Select inputs
  type: string;
  amount: number | string;
  tempId: number;
}

export default function VoucherEditForm({
  companyId,
  voucher,
  ledgers, // Assumes [{id: "1", name: "Cash", ...}]
  isAdmin,
}: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    message: string;
    txid: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Initialize Date (Handle ISO format for input type="date")
  const [date, setDate] = useState(
    voucher.date ? new Date(voucher.date).toISOString().split("T")[0] : ""
  );

  const [narration, setNarration] = useState(voucher.narration || "");

  // 2. Initialize Entries (CRITICAL FIX for Dropdowns)
  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    // Prefer the 'entries' prop if my previous server fix is applied, else fallback
    const sourceData = voucher.entries || voucher.ledgerEntries || [];

    if (sourceData.length > 0) {
      return sourceData.map((e: any) => ({
        ledgerId: e.ledgerId.toString(), // FORCE STRING to match <select> options
        type: e.amount < 0 ? "Dr" : "Cr",
        amount: Math.abs(e.amount),
        tempId: Math.random(),
      }));
    }
    // Default empty rows if no data
    return [
      { ledgerId: "", type: "Dr", amount: "", tempId: Math.random() },
      { ledgerId: "", type: "Cr", amount: "", tempId: Math.random() },
    ];
  });

  // Helper: Add new row
  const addRow = () => {
    setEntries([
      ...entries,
      { ledgerId: "", type: "Dr", amount: "", tempId: Math.random() },
    ]);
  };

  // Helper: Remove row
  const removeRow = (tempId: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((e) => e.tempId !== tempId));
    }
  };

  // Helper: Update specific field in a row
  const updateEntry = (
    tempId: number,
    field: keyof LedgerEntry,
    value: any
  ) => {
    setEntries(
      entries.map((e) => (e.tempId === tempId ? { ...e, [field]: value } : e))
    );
  };

  // Calculation Logic
  const totalDr = entries
    .filter((e) => e.type === "Dr")
    .reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0);

  const totalCr = entries
    .filter((e) => e.type === "Cr")
    .reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0);

  const difference = Math.abs(totalDr - totalCr);
  const isBalanced = difference < 0.01 && totalDr > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Validation: Check for empty fields
    if (entries.some((e) => !e.ledgerId || !e.amount)) {
      setErrorMsg("Please fill in all ledger and amount fields.");
      setLoading(false);
      return;
    }

    const payload = {
      date,
      narration,
      totalAmount: totalDr,
      ledgerEntries: entries.map((e) => ({
        ledgerId: parseInt(e.ledgerId),
        amount:
          e.type === "Dr"
            ? -Math.abs(parseFloat(e.amount.toString()))
            : Math.abs(parseFloat(e.amount.toString())),
      })),
    };

    const res = await updateVoucher(
      voucher.id,
      companyId,
      voucher.type,
      payload
    );

    if (res.success) {
      setSuccessData({
        message: isAdmin
          ? "Modifications saved and auto-verified (Admin privilege)."
          : "Changes submitted for Checker verification.",
        txid: res.txid || "N/A",
      });

      setTimeout(() => {
        router.push(`/companies/${companyId}/vouchers`);
        router.refresh();
      }, 3000);
    } else {
      setErrorMsg(res.error || "Update failed");
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div
        className={`rounded-2xl p-10 text-white shadow-2xl animate-in zoom-in-95 flex flex-col items-center text-center gap-4 ${
          isAdmin ? "bg-indigo-600" : "bg-emerald-600"
        }`}
      >
        {isAdmin ? (
          <ShieldCheck size={64} fill="white" className="text-indigo-600" />
        ) : (
          <CheckCircle2 size={64} />
        )}
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Voucher Synchronized
        </h2>
        <p className="text-white/80 text-sm max-w-md font-bold leading-relaxed">
          {successData.message}
        </p>
        <div className="bg-black/20 border border-white/20 px-6 py-3 rounded-xl font-mono text-lg font-bold mt-2">
          REF TXID: {successData.txid}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest opacity-60">
          <Loader2 className="animate-spin" size={12} /> Updating Ledgers...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* --- DATE SELECTION --- */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400">
          <Calendar size={20} />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Voucher Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-900 outline-none text-lg"
          />
        </div>
      </div>

      {/* --- MAIN GRID UI (THE MISSING PART) --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-0 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-2 p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-100">
            Type
          </div>
          <div className="col-span-6 p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100">
            Particulars (Ledger)
          </div>
          <div className="col-span-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">
            Amount
          </div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-100">
          {entries.map((entry, index) => (
            <div
              key={entry.tempId}
              className="grid grid-cols-12 gap-0 group hover:bg-slate-50 transition-colors"
            >
              {/* Dr/Cr Selector */}
              <div className="col-span-2 border-r border-slate-100 p-2">
                <select
                  value={entry.type}
                  onChange={(e) =>
                    updateEntry(entry.tempId, "type", e.target.value)
                  }
                  className={`w-full h-full text-center font-bold outline-none bg-transparent rounded-lg cursor-pointer ${
                    entry.type === "Dr" ? "text-indigo-600" : "text-emerald-600"
                  }`}
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>

              {/* Ledger Selector */}
              <div className="col-span-6 border-r border-slate-100 p-2 relative">
                <select
                  value={entry.ledgerId}
                  onChange={(e) =>
                    updateEntry(entry.tempId, "ledgerId", e.target.value)
                  }
                  className="w-full h-full font-medium text-slate-700 outline-none bg-transparent appearance-none px-2 cursor-pointer"
                >
                  <option value="" disabled>
                    Select Account...
                  </option>
                  {ledgers.map((l: any) => (
                    <option key={l.id} value={l.id.toString()}>
                      {l.name} ({l.group?.name})
                    </option>
                  ))}
                </select>
                {/* Custom arrow for select */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                  <Plus size={14} className="rotate-45" />
                </div>
              </div>

              {/* Amount Input */}
              <div className="col-span-3 p-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={entry.amount}
                  onChange={(e) =>
                    updateEntry(entry.tempId, "amount", e.target.value)
                  }
                  className="w-full h-full text-right font-mono font-bold text-slate-900 outline-none bg-transparent placeholder:text-slate-300"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Delete Action */}
              <div className="col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeRow(entry.tempId)}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                  tabIndex={-1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="w-full py-3 text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all border-t border-dashed border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Line Item
        </button>
      </div>

      {/* Footer Totals */}
      <div className="flex flex-col md:flex-row gap-6">
        <textarea
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="flex-1 h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          placeholder="Edit narration..."
        />
        <div
          className={`w-full md:w-72 p-6 rounded-3xl shadow-xl text-white ${
            isAdmin ? "bg-indigo-900" : "bg-slate-900"
          }`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase opacity-50 font-black">
              <span>Dr Total</span>
              <span className="font-mono">₹{totalDr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase opacity-50 font-black">
              <span>Cr Total</span>
              <span className="font-mono">₹{totalCr.toFixed(2)}</span>
            </div>
            <div
              className={`pt-4 border-t border-white/10 flex justify-between items-center ${
                isBalanced ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <span className="text-[10px] uppercase font-black">
                Balance Diff
              </span>
              <span className="font-mono font-bold">
                ₹{difference.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isBalanced || loading}
        className={`w-full py-4 rounded-xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]
          ${
            isAdmin
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }
          ${!isBalanced || loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : isAdmin ? (
          <ShieldCheck size={18} />
        ) : (
          <Save size={18} />
        )}
        {isAdmin
          ? "Update & Authorize Instantly"
          : "Update & Send for Verification"}
      </button>
    </form>
  );
}
