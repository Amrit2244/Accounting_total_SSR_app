"use client";

import { useState } from "react";
import { updateBankDate } from "@/app/actions/banking";
import { Check } from "lucide-react";

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

  return (
    <tr
      className={`hover:bg-blue-50/50 transition-colors border-b border-slate-50 text-[11px] font-medium ${
        date ? "bg-emerald-50/30" : ""
      }`}
    >
      <td className="p-2 text-slate-500 font-mono">
        {new Date(entry.voucher.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })}
      </td>
      <td className="p-2 text-slate-800">
        <div
          className="font-bold truncate max-w-[200px]"
          title={entry.voucher.narration}
        >
          {entry.voucher.narration || "—"}
        </div>
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
          {entry.voucher.type.slice(0, 3)} #{entry.voucher.voucherNo}
        </div>
      </td>
      <td className="p-2 text-right font-mono font-bold text-slate-700">
        {entry.amount > 0 ? entry.amount.toFixed(2) : "—"}
      </td>
      <td className="p-2 text-right font-mono font-bold text-slate-700">
        {entry.amount < 0 ? Math.abs(entry.amount).toFixed(2) : "—"}
      </td>
      <td className="p-2 text-center w-32">
        <div className="relative flex items-center justify-center">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`h-7 w-28 px-1 text-[10px] font-bold border rounded bg-white outline-none focus:border-blue-50 transition-colors ${
              date
                ? "border-emerald-400 text-emerald-700"
                : "border-slate-200 text-slate-400"
            }`}
          />
          {saved && (
            <Check
              size={12}
              className="absolute -right-3 text-emerald-600 animate-in fade-in zoom-in"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
