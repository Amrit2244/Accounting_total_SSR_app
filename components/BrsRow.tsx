"use client";

import { useState } from "react";
import { updateBankDate } from "@/app/actions/banking";
import { Check, Calendar } from "lucide-react";

type Props = { entry: any };

export default function BrsRow({ entry }: Props) {
  const initialDate = entry.bankDate
    ? new Date(entry.bankDate).toISOString().split("T")[0]
    : "";
  const [date, setDate] = useState(initialDate);
  const [saved, setSaved] = useState(false);

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setSaved(false);

    // ✅ FIX: Pass 'entry.voucher.type' as the first argument
    if (newDate) {
      await updateBankDate(entry.voucher.type, entry.id, newDate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      await updateBankDate(entry.voucher.type, entry.id, null);
    }
  };

  const isReconciled = !!date;

  return (
    <tr
      className={`group border-b border-slate-50 text-xs transition-colors ${
        isReconciled
          ? "bg-emerald-50/40 hover:bg-emerald-50/60"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Voucher Date */}
      <td className="p-3 pl-4 text-slate-500 font-mono font-medium whitespace-nowrap">
        {new Date(entry.voucher.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })}
      </td>

      {/* Particulars & Voucher No */}
      <td className="p-3">
        <div className="flex flex-col gap-1">
          <div
            className="font-bold text-slate-800 truncate max-w-[240px]"
            title={entry.voucher.narration}
          >
            {entry.voucher.narration || (
              <span className="text-slate-300 italic">No Narration</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-slate-300 transition-colors">
              {entry.voucher.type.slice(0, 3)} #{entry.voucher.voucherNo}
            </span>
          </div>
        </div>
      </td>

      {/* Debit (Withdrawal) */}
      <td className="p-3 text-right font-mono font-bold text-slate-700">
        {entry.amount > 0 ? (
          entry.amount.toFixed(2)
        ) : (
          <span className="text-slate-200">-</span>
        )}
      </td>

      {/* Credit (Deposit) */}
      <td className="p-3 text-right font-mono font-bold text-slate-700">
        {entry.amount < 0 ? (
          Math.abs(entry.amount).toFixed(2)
        ) : (
          <span className="text-slate-200">-</span>
        )}
      </td>

      {/* Bank Date Input */}
      <td className="p-3 pr-4 w-40">
        <div className="relative flex items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`h-9 w-full px-3 text-xs font-bold rounded-lg border outline-none transition-all cursor-pointer shadow-sm
              ${
                isReconciled
                  ? "border-emerald-300 bg-white text-emerald-700 focus:ring-2 focus:ring-emerald-200"
                  : "border-slate-200 bg-white text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              }
            `}
          />

          {/* Status Indicator / Icon */}
          <div className="absolute right-3 pointer-events-none flex items-center">
            {saved ? (
              <Check
                size={14}
                className="text-emerald-600 animate-in zoom-in spin-in-90 duration-300"
              />
            ) : !isReconciled ? (
              <Calendar
                size={14}
                className="text-slate-300 group-hover:text-slate-400 transition-colors"
              />
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}
