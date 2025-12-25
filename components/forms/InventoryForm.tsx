"use client";

import { useActionState } from "react";
import { createStockItem } from "@/app/actions/masters";
import {
  Package,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  Hash,
  CheckCircle,
  Scale,
  Barcode,
  IndianRupee,
} from "lucide-react";

type Group = { id: number; name: string };
type Unit = { id: number; name: string; symbol: string };

// ✅ 1. Define the exact State interface to match your Server Action
interface InventoryActionState {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    groupId?: string[];
    unitId?: string[];
    openingQty?: string[];
    openingRate?: string[];
    companyId?: string[];
    partNumber?: string[];
  };
}

// ✅ 2. Define the Initial State with 'undefined' for errors
const initialState: InventoryActionState = {
  success: false,
  message: "",
  errors: undefined,
};

// ✅ 3. Wrapper with explicit Type Casting
async function createStockItemWrapper(
  prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const result = await createStockItem(prevState, formData);
  return result as InventoryActionState;
}

export default function InventoryForm({
  companyId,
  groups,
  units,
}: {
  companyId: number;
  groups: Group[];
  units: Unit[];
}) {
  // ✅ 4. Connect using the wrapper and the typed initialState
  const [state, action, isPending] = useActionState(
    createStockItemWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-8 font-sans p-1">
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS BANNERS --- */}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <CheckCircle size={18} className="shrink-0" />
          <span>Stock Item created successfully!</span>
        </div>
      )}

      {/* --- MAIN FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item Name */}
        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Package
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Dell Monitor 24 inch"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          {state.errors?.name && (
            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Part Number */}
        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Part No / SKU{" "}
            <span className="text-slate-400 font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative group">
            <Barcode
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="partNumber"
              type="text"
              placeholder="e.g. DEL-MON-24"
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 uppercase"
            />
          </div>
        </div>

        {/* Group Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Stock Group <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Layers
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <select
              name="groupId"
              required
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer transition-all"
              defaultValue=""
            >
              <option value="" disabled>
                Select Group...
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unit Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Unit <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Scale
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <select
              name="unitId"
              required
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer transition-all"
              defaultValue=""
            >
              <option value="" disabled>
                Select Unit...
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id.toString()}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- OPENING STOCK --- */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 gap-5 relative overflow-hidden">
        {/* Decorative left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300" />

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Opening Qty
          </label>
          <div className="relative group">
            <Hash
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="openingQty"
              type="number"
              placeholder="0"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm font-mono font-bold text-right text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Rate per Unit
          </label>
          <div className="relative group">
            <IndianRupee
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="openingRate"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm font-mono font-bold text-right text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* --- ACTION BUTTON --- */}
      <div className="flex justify-end pt-2">
        <button
          disabled={isPending || units.length === 0}
          className="group relative flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-8 h-11 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          <span>Save Stock Item</span>
        </button>
      </div>
    </form>
  );
}
