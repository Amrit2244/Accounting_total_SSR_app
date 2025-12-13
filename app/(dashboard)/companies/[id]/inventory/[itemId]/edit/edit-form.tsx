"use client";

import { useActionState } from "react";
import { updateStockItem } from "@/app/actions/masters";
import { Save, AlertCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  companyId: number;
  item: {
    id: number;
    name: string;
    gstRate: number;
    // add other fields if necessary
  };
};

export default function EditItemForm({ companyId, item }: Props) {
  // ✅ useActionState ensures the arguments (prevState, formData) are passed correctly
  const [state, action, isPending] = useActionState(updateStockItem, undefined);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="id" value={item.id} />

      {/* Error Message Banner */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={16} /> {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Item Name
        </label>
        <input
          name="name"
          type="text"
          defaultValue={item.name}
          required
          className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          GST Tax Rate (%)
        </label>
        <select
          name="gstRate"
          defaultValue={item.gstRate}
          className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366] bg-white"
        >
          <option value="0">0% (Exempt)</option>
          <option value="5">5%</option>
          <option value="12">12%</option>
          <option value="18">18%</option>
          <option value="28">28%</option>
        </select>
      </div>

      <button
        disabled={isPending}
        className="bg-orange-600 text-white w-full py-3 rounded-lg font-bold shadow hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? (
          "Saving..."
        ) : (
          <>
            <Save size={18} /> UPDATE ITEM
          </>
        )}
      </button>
    </form>
  );
}
