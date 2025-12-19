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
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS BANNERS --- */}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>Stock Item created successfully!</span>
        </div>
      )}

      {/* --- MAIN FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              type="text"
              required
              placeholder="e.g. Dell Monitor 24 inch"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
            />
          </div>
          {state.errors?.name && (
            <p className="text-[10px] text-red-500 ml-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Part No / SKU (Optional)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Barcode size={18} />
            </div>
            <input
              name="partNumber"
              type="text"
              placeholder="e.g. DEL-MON-24"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
            />
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer font-medium"
              defaultValue=""
            >
              <option value="" disabled>
                Select Group
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer font-medium"
              defaultValue=""
            >
              <option value="" disabled>
                Select Unit
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
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-right focus:ring-2 focus:ring-blue-600 outline-none font-mono"
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
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-right focus:ring-2 focus:ring-blue-600 outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending || units.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Stock Item
        </button>
      </div>
    </form>
  );
}
