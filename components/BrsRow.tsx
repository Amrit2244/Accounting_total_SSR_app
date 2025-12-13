"use client";

import { useState } from "react";
import { updateBankDate } from "@/app/actions/banking";
import { Check, Calendar } from "lucide-react";

type Props = {
  entry: any;
};

export default function BrsRow({ entry }: Props) {
  // Use the existing bankDate or empty string
  const initialDate = entry.bankDate
    ? new Date(entry.bankDate).toISOString().split("T")[0]
    : "";
  const [date, setDate] = useState(initialDate);
  const [saved, setSaved] = useState(false);

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setSaved(false);

    // Auto-save on change
    if (newDate) {
      await updateBankDate(entry.id, newDate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000); // Hide tick after 2s
    } else {
      // If cleared
      await updateBankDate(entry.id, null);
    }
  };

  return (
    <tr
      className={`hover:bg-blue-50 transition-colors ${
        date ? "bg-green-50" : ""
      }`}
    >
      <td className="p-3 border-r text-gray-600">
        {new Date(entry.voucher.date).toLocaleDateString()}
      </td>
      <td className="p-3 border-r font-medium text-[#003366]">
        {entry.voucher.narration || "As per details"}
        <div className="text-[10px] text-gray-400 uppercase">
          {entry.voucher.type} #{entry.voucher.voucherNo}
        </div>
      </td>
      <td className="p-3 border-r text-right font-mono text-slate-700">
        {entry.amount > 0 ? entry.amount.toFixed(2) : "-"}
      </td>
      <td className="p-3 border-r text-right font-mono text-slate-700">
        {entry.amount < 0 ? Math.abs(entry.amount).toFixed(2) : "-"}
      </td>
      <td className="p-2 text-center relative">
        <div className="flex items-center justify-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`border p-1 rounded text-xs font-bold w-32 ${
              date
                ? "border-green-400 text-green-700"
                : "border-gray-300 text-gray-400"
            }`}
          />
          {saved && (
            <Check
              size={16}
              className="text-green-600 animate-in fade-in zoom-in"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
