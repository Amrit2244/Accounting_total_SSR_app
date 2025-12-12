"use client";
import { useActionState } from "react";
import { createStockItem } from "@/app/actions/inventory";
import Link from "next/link";

export default function CreateItemForm({ companyId, units }: any) {
  const [state, action, isPending] = useActionState(createStockItem, undefined);

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <p className="text-red-800 bg-red-100 p-3 rounded font-bold border border-red-300">
          {state.error}
        </p>
      )}

      <input type="hidden" name="companyId" value={companyId} />

      {/* Item Name */}
      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Item Name
        </label>
        <input
          name="name"
          required
          className="w-full border border-gray-400 p-2 rounded text-black font-medium focus:ring-2 focus:ring-black outline-none bg-gray-50"
          placeholder="e.g. Dell Monitor 24 inch"
        />
      </div>

      {/* Part Number */}
      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Part Number / SKU (Optional)
        </label>
        <input
          name="partNumber"
          className="w-full border border-gray-400 p-2 rounded text-black font-medium focus:ring-2 focus:ring-black outline-none bg-gray-50"
          placeholder="e.g. DEL-24-MN"
        />
      </div>

      {/* Unit Dropdown */}
      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Unit of Measurement
        </label>
        <select
          name="unitId"
          className="w-full border border-gray-400 p-2 rounded text-black font-medium bg-white focus:ring-2 focus:ring-black outline-none"
          required
        >
          <option value="" className="text-gray-500">
            -- Select Unit --
          </option>
          {units.map((u: any) => (
            <option key={u.id} value={u.id} className="text-black font-medium">
              {u.symbol} - {u.name}
            </option>
          ))}
        </select>
        {units.length === 0 && (
          <p className="text-xs text-red-600 font-bold mt-1">
            * You must create a Unit first.
          </p>
        )}
      </div>

      {/* Opening Balance Section (Optional) */}
      <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded border border-gray-300">
        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">
            Opening Qty
          </label>
          <input
            name="openingQty"
            type="number"
            className="w-full border border-gray-400 p-2 rounded text-black text-right font-medium"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">
            Rate
          </label>
          <input
            name="openingRate"
            type="number"
            className="w-full border border-gray-400 p-2 rounded text-black text-right font-medium"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-6 py-2 border border-gray-400 rounded text-black font-bold hover:bg-gray-200"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          className="flex-1 bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Item"}
        </button>
      </div>
    </form>
  );
}
