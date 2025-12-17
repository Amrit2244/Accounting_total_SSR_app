"use client";

import React, { useState, useMemo } from "react";
import { useActionState } from "react";
import {
  Save,
  Loader2,
  ListPlus,
  Trash2,
  CheckCircle,
  ShieldAlert,
  Calendar,
  Tag,
} from "lucide-react";
import { updateVoucher } from "@/app/actions/masters";

export default function VoucherEditForm({ companyId, voucher, ledgers }: any) {
  const initialData = useMemo(
    () => ({
      date: new Date(voucher.date).toISOString().split("T")[0],
      narration: voucher.narration || "",
      entriesJson: JSON.stringify(
        voucher.entries
          .map((e: any) => ({
            lid: e.ledgerId,
            amt: Number(e.amount).toFixed(2),
          }))
          .sort((a: any, b: any) => a.lid - b.lid)
      ),
    }),
    [voucher]
  );

  const [date, setDate] = useState(initialData.date);
  const [narration, setNarration] = useState(initialData.narration);
  const [entries, setEntries] = useState(
    voucher.entries.map((e: any) => ({
      ...e,
      tempId: e.id || Math.random(),
      ledgerId: e.ledgerId,
    }))
  );

  const [state, action, isPending] = useActionState(updateVoucher as any, null);

  const { totalDebit, totalCredit, currentEntriesJson } = useMemo(() => {
    const d = entries.reduce(
      (sum: number, e: any) => sum + (e.amount > 0 ? Number(e.amount) : 0),
      0
    );
    const c = entries.reduce(
      (sum: number, e: any) =>
        sum + (e.amount < 0 ? Math.abs(Number(e.amount)) : 0),
      0
    );

    const validOnes = entries
      .filter((e: any) => e.ledgerId && Math.abs(Number(e.amount)) > 0)
      .map((e: any) => ({
        ledgerId: Number(e.ledgerId),
        amount: Number(e.amount),
      }))
      .sort((a: any, b: any) => a.ledgerId - b.ledgerId);

    return {
      totalDebit: Math.round(d * 100) / 100,
      totalCredit: Math.round(c * 100) / 100,
      currentEntriesJson: JSON.stringify(validOnes),
    };
  }, [entries]);

  const isBalanced =
    Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const isDirty =
    date !== initialData.date ||
    narration !== initialData.narration ||
    currentEntriesJson !== initialData.entriesJson;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="voucherId" value={voucher.id} />
      <input
        type="hidden"
        name="structuredEntries"
        value={currentEntriesJson}
      />

      {state?.success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle size={18} /> {state.message}
        </div>
      )}

      {state?.message && !state?.success && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <ShieldAlert size={18} /> {state.message}
        </div>
      )}

      {/* Header Fields */}
      <div className="bg-white p-6 border rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Calendar size={12} /> Date
          </label>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Tag size={12} /> Transaction ID
          </label>
          <div className="p-2 border bg-slate-50 rounded-lg text-slate-400 font-mono">
            {voucher.transactionCode || "---"}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
            <ShieldAlert size={12} /> Verification Status
          </label>
          <div
            className={`p-2 border rounded-lg font-bold text-center ${
              voucher.status === "APPROVED"
                ? "text-emerald-600 bg-emerald-50"
                : "text-amber-600 bg-amber-50"
            }`}
          >
            {voucher.status}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 text-left">Ledger Account</th>
              <th className="p-3 text-right w-44">Debit</th>
              <th className="p-3 text-right w-44">Credit</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry: any) => (
              <tr key={entry.tempId}>
                <td className="p-2">
                  <select
                    value={entry.ledgerId || ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? { ...ent, ledgerId: parseInt(e.target.value) }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 border-none bg-transparent"
                  >
                    <option value="">Select Ledger...</option>
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
                    value={entry.amount > 0 ? entry.amount : ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? {
                                ...ent,
                                amount: parseFloat(e.target.value) || 0,
                              }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 text-right outline-none bg-transparent font-medium"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={entry.amount < 0 ? Math.abs(entry.amount) : ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? {
                                ...ent,
                                amount: -(parseFloat(e.target.value) || 0),
                              }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 text-right outline-none bg-transparent font-medium"
                    placeholder="0.00"
                  />
                </td>
                <td
                  className="p-2 text-center"
                  onClick={() =>
                    setEntries(
                      entries.filter((e: any) => e.tempId !== entry.tempId)
                    )
                  }
                >
                  <Trash2
                    size={16}
                    className="text-slate-300 hover:text-red-500 cursor-pointer inline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t-2">
            <tr>
              <td className="p-3 text-right">
                <button
                  type="button"
                  onClick={() =>
                    setEntries([
                      ...entries,
                      { tempId: Math.random(), ledgerId: null, amount: 0 },
                    ])
                  }
                  className="text-blue-600 text-sm flex items-center gap-1 float-left hover:underline"
                >
                  <ListPlus size={16} /> Add Row
                </button>
                TOTALS
              </td>
              <td
                className={`p-3 text-right ${
                  !isBalanced ? "text-red-500" : ""
                }`}
              >
                {totalDebit.toFixed(2)}
              </td>
              <td
                className={`p-3 text-right ${
                  !isBalanced ? "text-red-500" : ""
                }`}
              >
                {totalCredit.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <textarea
        value={narration}
        onChange={(e) => setNarration(e.target.value)}
        name="narration"
        rows={2}
        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        placeholder="Reason for change..."
      />

      <button
        disabled={isPending || !isBalanced || !isDirty}
        type="submit"
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
          ${
            !isBalanced || !isDirty
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
          }`}
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Save size={20} />
        )}
        {!isDirty
          ? "NO CHANGES DETECTED"
          : !isBalanced
          ? "VOUCHER UNBALANCED"
          : "SEND FOR VERIFICATION"}
      </button>
    </form>
  );
}
