"use client";

import { useActionState } from "react";
import { createStockItem } from "@/app/actions/masters";
import {
  Package,
  Barcode,
  Scale,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Hash,
  IndianRupee,
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
    <form action={action} className="space-y-4 font-sans">
      <input type="hidden" name="companyId" value={companyId} />

      {state?.error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <AlertCircle size={12} /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <CheckCircle size={12} /> Item Created!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2 space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Package
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="name"
              required
              placeholder="e.g. 24-inch Monitor"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Part No / SKU
          </label>
          <div className="relative">
            <Barcode
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="partNumber"
              placeholder="OPTIONAL"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all uppercase placeholder:normal-case"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Group <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Layers
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              name="groupId"
              required
              defaultValue=""
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select...
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Scale
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              name="unitId"
              required
              defaultValue=""
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select...
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Opening Qty
          </label>
          <div className="relative">
            <Hash
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="openingQty"
              type="number"
              placeholder="0"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-right outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Rate
          </label>
          <div className="relative">
            <IndianRupee
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="openingRate"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-right outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          disabled={isPending || units.length === 0}
          className="bg-[#003366] hover:bg-black text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          SAVE ITEM
        </button>
      </div>
    </form>
  );
}
