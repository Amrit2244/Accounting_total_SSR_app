"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { updateVoucher } from "@/app/actions/voucher";

// ✅ 1. Define the interface to stop the "implicitly has any" build error
interface LedgerEntry {
  ledgerId: number;
  type: string; // "Dr" or "Cr"
  amount: number | string;
  tempId: number;
}

export default function VoucherEditForm({ companyId, voucher, ledgers }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    message: string;
    txid: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [date, setDate] = useState(
    voucher.date ? new Date(voucher.date).toISOString().split("T")[0] : ""
  );
  const [narration, setNarration] = useState(voucher.narration || "");

  // ✅ 2. Assign the interface to the state
  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    if (voucher.ledgerEntries && voucher.ledgerEntries.length > 0) {
      return voucher.ledgerEntries.map((e: any) => ({
        ledgerId: e.ledgerId,
        type: e.amount < 0 ? "Dr" : "Cr",
        amount: Math.abs(e.amount),
        tempId: Math.random(),
      }));
    }
    return [];
  });

  // ✅ 3. Totals calculation now has types, fixing the build error
  const totalDr = entries
    .filter((e: LedgerEntry) => e.type === "Dr")
    .reduce(
      (s: number, e: LedgerEntry) => s + (parseFloat(e.amount.toString()) || 0),
      0
    );

  const totalCr = entries
    .filter((e: LedgerEntry) => e.type === "Cr")
    .reduce(
      (s: number, e: LedgerEntry) => s + (parseFloat(e.amount.toString()) || 0),
      0
    );

  const difference = Math.abs(totalDr - totalCr);
  const isBalanced = difference < 0.01 && totalDr > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const payload = {
      date,
      narration,
      totalAmount: totalDr,
      ledgerEntries: entries.map((e) => ({
        ledgerId: parseInt(e.ledgerId.toString()),
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
      // ✅ Custom message with New TXID
      setSuccessData({
        message:
          "edited and send for verification with new generate new txid of that voucher",
        txid: res.txid || "N/A",
      });

      setTimeout(() => {
        router.push(`/companies/${companyId}/vouchers`);
        router.refresh();
      }, 4000);
    } else {
      setErrorMsg(res.error || "Update failed");
      setLoading(false);
    }
  };

  const addRow = () => {
    setEntries([
      ...entries,
      {
        ledgerId: ledgers[0]?.id,
        type: "Dr",
        amount: 0,
        tempId: Math.random(),
      },
    ]);
  };

  if (entries.length === 0 && voucher.ledgerEntries?.length > 0) {
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        Loading Details...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successData && (
        <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-2xl animate-in zoom-in-95 flex flex-col items-center text-center gap-4">
          <CheckCircle2 size={56} className="text-emerald-100" />
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Voucher Updated
          </h2>
          <p className="text-emerald-50 text-sm max-w-md font-bold leading-relaxed">
            {successData.message}
          </p>
          <div className="bg-white/20 border border-white/30 px-6 py-3 rounded-xl font-mono text-lg font-bold mt-2 shadow-inner">
            NEW TXID: {successData.txid}
          </div>
          <p className="text-[10px] uppercase font-bold text-emerald-300 mt-4 animate-pulse">
            Redirecting to Daybook in 4 seconds...
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {!successData && (
        <>
          {/* Header, Table, and Footer UI remains exactly as you had it */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">
                Posting Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded border font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">
                Reference
              </label>
              <div className="p-2 font-mono font-bold text-slate-600 bg-slate-200/50 rounded flex justify-between">
                <span>#{voucher.voucherNo}</span>
                <span className="text-[10px] opacity-50">{voucher.type}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] uppercase p-4 tracking-widest">
                <tr>
                  <th className="p-4 w-24">Side</th>
                  <th className="p-4">Ledger Particulars</th>
                  <th className="p-4 text-right w-40">Amount</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {entries.map((entry, idx) => (
                  <tr key={entry.tempId} className="border-b border-slate-100">
                    <td className="p-2">
                      <select
                        value={entry.type}
                        onChange={(e) => {
                          const n = [...entries];
                          n[idx].type = e.target.value;
                          setEntries(n);
                        }}
                        className="w-full p-2 bg-slate-100 rounded font-bold text-xs"
                      >
                        <option value="Dr">Dr</option>
                        <option value="Cr">Cr</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={entry.ledgerId}
                        onChange={(e) => {
                          const n = [...entries];
                          n[idx].ledgerId = parseInt(e.target.value);
                          setEntries(n);
                        }}
                        className="w-full p-2 bg-slate-100 rounded font-bold text-xs"
                      >
                        {ledgers.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={entry.amount}
                        onChange={(e) => {
                          const n = [...entries];
                          n[idx].amount = e.target.value;
                          setEntries(n);
                        }}
                        className="w-full p-2 bg-slate-100 rounded text-right font-mono font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEntries(entries.filter((_, i) => i !== idx))
                        }
                        className="text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addRow}
              className="w-full py-3 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 border-t border-slate-200"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="flex-1 h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none"
              placeholder="Edit narration..."
            />
            <div className="w-full md:w-72 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase opacity-50">
                    Dr Total
                  </span>
                  <span className="font-mono">₹{totalDr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase opacity-50">
                    Cr Total
                  </span>
                  <span className="font-mono">₹{totalCr.toFixed(2)}</span>
                </div>
                <div
                  className={`pt-4 border-t border-white/10 flex justify-between items-center ${
                    isBalanced ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <span className="text-[10px] uppercase font-black">Diff</span>
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
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Update & Send for Verification
          </button>
        </>
      )}
    </form>
  );
}
