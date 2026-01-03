"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck, // New Icon
} from "lucide-react";
import { updateVoucher } from "@/app/actions/voucher"; // Path corrected

interface LedgerEntry {
  ledgerId: number;
  type: string;
  amount: number | string;
  tempId: number;
}

export default function VoucherEditForm({
  companyId,
  voucher,
  ledgers,
  isAdmin,
}: any) {
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

      {/* Main Form Fields (Date, Ledger Table) */}
      {/* ... keeping your existing table logic here ... */}

      <div className="flex flex-col md:flex-row gap-6">
        <textarea
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="flex-1 h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
