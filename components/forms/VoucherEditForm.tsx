"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useActionState } from "react";
import {
  Save,
  Loader2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import { updateVoucher, State } from "@/app/actions/voucher";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

// Wrapper to match useActionState signature if needed
async function updateVoucherWrapper(
  prevState: State,
  formData: FormData
): Promise<State> {
  return await updateVoucher(prevState, formData);
}

export default function VoucherEditForm({ companyId, voucher, ledgers }: any) {
  const router = useRouter();

  const initialData = useMemo(
    () => ({
      date: new Date(voucher.date).toISOString().split("T")[0],
      narration: voucher.narration || "",
    }),
    [voucher]
  );

  const [date, setDate] = useState(initialData.date);
  const [narration, setNarration] = useState(initialData.narration);

  // Flatten entries for simple editing
  const [entries, setEntries] = useState(
    (voucher.ledgerEntries || []).map((e: any) => ({
      ledgerId: e.ledgerId,
      type: e.amount > 0 ? "Dr" : "Cr",
      amount: Math.abs(e.amount),
      tempId: Math.random(),
    }))
  );

  const initialState: State = { success: false };
  const [state, action, isPending] = useActionState(
    updateVoucherWrapper,
    initialState
  );

  // Calculations
  const totalDr = entries
    .filter((e: any) => e.type === "Dr")
    .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
  const totalCr = entries
    .filter((e: any) => e.type === "Cr")
    .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

  // Effects
  useEffect(() => {
    if (state.success) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981"],
      });
      setTimeout(() => {
        router.push(`/companies/${companyId}/vouchers`);
        router.refresh();
      }, 2000);
    }
  }, [state.success, companyId, router]);

  // Handlers
  const updateEntry = (idx: number, field: string, val: any) => {
    const n = [...entries];
    n[idx][field] = val;
    setEntries(n);
  };

  return (
    <form action={action} className="space-y-6 font-sans p-1">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="voucherId" value={voucher.id} />
      <input type="hidden" name="type" value={voucher.type} />

      {/* Map entries back to 'rows' format expected by updateVoucher action */}
      <input type="hidden" name="rows" value={JSON.stringify(entries)} />

      {/* Success Banner */}
      {state.success && (
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl animate-in zoom-in-95 flex items-center gap-4">
          <CheckCircle size={32} />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              Update Successful
            </h2>
            <p className="text-emerald-100 text-sm font-medium">
              Approvals reset. Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-amber-800 font-bold text-xs uppercase tracking-wide mb-1">
            Modification Warning
          </h3>
          <p className="text-amber-700 text-xs leading-relaxed">
            Editing this voucher will{" "}
            <strong className="font-bold">generate a new Transaction ID</strong>{" "}
            and reset the status to{" "}
            <strong className="font-bold">PENDING</strong>. You will become the
            Maker of this record.
          </p>
        </div>
      </div>

      {state.error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 shadow-sm animate-in fade-in">
          {state.error}
        </div>
      )}

      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Calendar size={12} /> Posting Date
          </label>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 font-bold text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <FileText size={12} /> Voucher Type
          </label>
          <div className="h-11 flex items-center px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide mr-2 border border-slate-200">
              {voucher.type}
            </span>
            #{voucher.voucherNo}
          </div>
        </div>
      </div>

      {/* Simple Ledger Edit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50">
        <div className="bg-slate-900 text-white p-4 text-[10px] font-black uppercase grid grid-cols-12 tracking-widest">
          <div className="col-span-2">Type</div>
          <div className="col-span-6 pl-2">Account</div>
          <div className="col-span-3 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>

        <div className="p-2 space-y-2 bg-slate-50/30">
          {entries.map((entry: any, idx: number) => (
            <div
              key={entry.tempId}
              className="grid grid-cols-12 gap-3 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors group"
            >
              <select
                value={entry.type}
                onChange={(e) => updateEntry(idx, "type", e.target.value)}
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
              >
                <option value="Dr">Dr</option>
                <option value="Cr">Cr</option>
              </select>
              <select
                value={entry.ledgerId}
                onChange={(e) => updateEntry(idx, "ledgerId", e.target.value)}
                className="col-span-6 h-10 border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
              >
                {ledgers.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={entry.amount}
                onChange={(e) => updateEntry(idx, "amount", e.target.value)}
                className="col-span-3 h-10 border border-slate-200 rounded-lg px-3 text-right text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <div className="col-span-1 text-center">
                <Trash2
                  size={16}
                  className="text-slate-300 hover:text-rose-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                  // ✅ FIXED: Added explicit type annotation for '_'
                  onClick={() =>
                    setEntries(entries.filter((_: any, i: number) => i !== idx))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setEntries([
              ...entries,
              {
                tempId: Math.random(),
                type: "Dr",
                amount: 0,
                ledgerId: ledgers[0]?.id,
              },
            ])
          }
          className="w-full py-3 bg-white text-[10px] font-black uppercase text-indigo-600 border-t border-slate-100 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 tracking-widest"
        >
          <Plus size={14} /> Add Line Item
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <textarea
          name="narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Reason for edit..."
          className="flex-1 border border-slate-200 rounded-2xl p-4 text-sm font-medium h-32 resize-none focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 placeholder:text-slate-400"
        />

        <div className="w-56 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-center text-right shadow-xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl" />

          <div className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1 relative z-10">
            Total Amount
          </div>
          <div
            className={`text-3xl font-mono font-bold leading-none relative z-10 ${
              !isBalanced ? "text-rose-400" : "text-white"
            }`}
          >
            <span className="text-lg text-slate-500 mr-1">₹</span>
            {totalDr.toFixed(2)}
          </div>
          {!isBalanced && (
            <div className="text-[10px] text-rose-400 font-black uppercase tracking-wider mt-2 bg-rose-950/30 py-1 px-2 rounded border border-rose-900/50 inline-block self-end relative z-10">
              Unbalanced
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending || !isBalanced}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:shadow-indigo-900/20 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Authorize & Commit Edits
        </button>
      </div>
    </form>
  );
}
