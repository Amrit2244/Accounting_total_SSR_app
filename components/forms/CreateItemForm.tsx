"use client";

import { useActionState } from "react";
import { createStockItem } from "@/app/actions/masters"; // Check this path matches your action file
import Link from "next/link";
import {
  Package,
  Barcode,
  Scale,
  Layers, // Added for Group
  Hash,
  IndianRupee,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

type Unit = { id: number; name: string; symbol: string };
type Group = { id: number; name: string };

export default function CreateItemForm({
  companyId,
  units,
  groups,
}: {
  companyId: number;
  units: Unit[];
  groups: Group[];
}) {
  const [state, action, isPending] = useActionState(createStockItem, undefined);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />

      {/* Error Banner */}
      {state?.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Success Banner */}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>Stock Item created successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Item Name */}
        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Package size={18} />
            </div>
            <input
              name="name"
              required
              placeholder="e.g. Dell Monitor 24 inch"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* 2. Part Number / SKU */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Part Number / SKU
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Barcode size={18} />
            </div>
            <input
              name="partNumber"
              placeholder="e.g. DEL-24-MN"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* 3. Stock Group (Added) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Stock Group <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Layers size={18} />
            </div>
            <select
              name="groupId"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer font-medium"
              defaultValue=""
            >
              <option value="" disabled>
                -- Select Group --
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Unit Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Unit <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Scale size={18} />
            </div>
            <select
              name="unitId"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer font-medium"
              defaultValue=""
            >
              <option value="" disabled>
                -- Select Unit --
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
          {units.length === 0 && (
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> No units found. Create a Unit first.
            </p>
          )}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 5. Opening Balance Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Opening Stock (Optional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Opening Qty
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Hash size={16} />
              </div>
              <input
                name="openingQty"
                type="number"
                placeholder="0"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-right focus:ring-2 focus:ring-blue-600 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Rate
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IndianRupee size={16} />
              </div>
              <input
                name="openingRate"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-right focus:ring-2 focus:ring-blue-600 outline-none transition-all font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button
          disabled={isPending || units.length === 0}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Save Item
            </>
          )}
        </button>
      </div>
    </form>
  );
}
