"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useActionState } from "react";
import {
  Save,
  Loader2,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { updateVoucher, State } from "@/app/actions/voucher";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

// Wrapper to match useActionState signature if needed
// Note: We cast the return of updateVoucher to ensure type safety
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
    <form action={action} className="space-y-6">
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
            <h2 className="text-xl font-black uppercase">Update Successful</h2>
            <p className="text-emerald-100 text-sm">
              Approvals reset. Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-amber-600 shrink-0" size={20} />
        <div>
          <h3 className="text-amber-800 font-bold text-xs uppercase tracking-wide">
            Modification Warning
          </h3>
          <p className="text-amber-700 text-xs mt-1">
            Editing this voucher will{" "}
            <strong>generate a new Transaction ID</strong> and reset the status
            to <strong>PENDING</strong>. You will become the Maker of this
            record.
          </p>
        </div>
      </div>

      {state.error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-200">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
            Posting Date
          </label>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 border rounded-lg px-3 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
            Voucher Type
          </label>
          <div className="h-10 flex items-center px-3 bg-slate-100 rounded-lg text-slate-500 font-bold text-xs">
            {voucher.type} #{voucher.voucherNo}
          </div>
        </div>
      </div>

      {/* Simple Ledger Edit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white p-3 text-[10px] font-black uppercase grid grid-cols-12">
          <div className="col-span-2">Type</div>
          <div className="col-span-6 pl-2">Account</div>
          <div className="col-span-3 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>
        <div className="p-2 space-y-2">
          {entries.map((entry: any, idx: number) => (
            <div
              key={entry.tempId}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <select
                value={entry.type}
                onChange={(e) => updateEntry(idx, "type", e.target.value)}
                className="col-span-2 h-9 border rounded px-2 text-xs font-bold outline-none focus:border-blue-500"
              >
                <option value="Dr">Dr</option>
                <option value="Cr">Cr</option>
              </select>
              <select
                value={entry.ledgerId}
                onChange={(e) => updateEntry(idx, "ledgerId", e.target.value)}
                className="col-span-6 h-9 border rounded px-2 text-xs font-medium outline-none focus:border-blue-500"
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
                className="col-span-3 h-9 border rounded px-2 text-right text-sm font-mono font-bold outline-none focus:border-blue-500"
              />
              <div className="col-span-1 text-center">
                <Trash2
                  size={16}
                  className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
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
          className="w-full py-2 bg-slate-50 text-xs font-bold text-blue-600 border-t hover:bg-blue-50 transition-colors"
        >
          + Add Row
        </button>
      </div>

      <div className="flex gap-4">
        <textarea
          name="narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Reason for edit..."
          className="flex-1 border rounded-xl p-3 text-xs h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="w-48 bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-center text-right shadow-lg">
          <div className="text-[10px] text-slate-400 font-bold uppercase">
            Total
          </div>
          <div
            className={`text-2xl font-mono font-bold ${
              !isBalanced ? "text-red-400" : ""
            }`}
          >
            {totalDr.toFixed(2)}
          </div>
          {!isBalanced && (
            <div className="text-[9px] text-red-400 font-bold">Unbalanced</div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !isBalanced}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        Authorize & Commit Edits
      </button>
    </form>
  );
}
