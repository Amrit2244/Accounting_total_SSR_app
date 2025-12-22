"use client";

// ✅ FIXED: Import from 'react' for Next.js 15 / React 19
import { useActionState } from "react";
import { updateStockItem } from "@/app/actions/masters";
import {
  Save,
  Package,
  IndianRupee,
  Layers,
  XCircle,
  CheckCircle2,
  Hash,
  Scale,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Group = { id: number; name: string };
type Unit = { id: number; name: string; symbol: string };

interface EditInventoryState {
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

const initialState: EditInventoryState = {
  success: false,
  message: "",
  errors: undefined,
};

async function updateStockItemWrapper(
  prevState: EditInventoryState,
  formData: FormData
): Promise<EditInventoryState> {
  // Debug log to confirm button click works
  console.log("Submitting Update...");
  return await updateStockItem(prevState, formData);
}

export default function EditInventoryForm({
  item,
  companyId,
  groups,
  units,
}: {
  item: any;
  companyId: number;
  groups: Group[];
  units: Unit[];
}) {
  // ✅ FIXED: Using the correct React 19 hook
  const [state, action, isPending] = useActionState(
    updateStockItemWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-6 relative isolate">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS MESSAGES --- */}
      {state?.message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border animate-in fade-in ${
            state.success
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          }`}
        >
          {state.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {state.message}
        </div>
      )}

      {/* ROW 1: Name & Unit (Z-Index High for Dropdown) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Package
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              name="name"
              defaultValue={item.name}
              required
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          {state.errors?.name && (
            <p className="text-red-500 text-[10px] mt-1 ml-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <div className="relative z-50">
            <Scale
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
            <select
              name="unitId"
              defaultValue={item.unitId || ""}
              required
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none cursor-pointer bg-white"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ROW 2: Group & Part No */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-40">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Stock Group
          </label>
          <div className="relative">
            <Layers
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <select
              name="groupId"
              defaultValue={item.groupId || ""}
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none cursor-pointer bg-white"
            >
              <option value="">Primary</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Part Number / SKU
          </label>
          <div className="relative">
            <Hash
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              name="partNumber"
              defaultValue={item.partNumber || ""}
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ROW 3: Balances (Dark Box) */}
      <div className="bg-slate-700 p-8 md:p-12 rounded-2xl text-white shadow-xl shadow-slate-200 relative z-0 mt-4">
        <div className="flex items-center gap-6 mb-6 text-blue-400 font-black uppercase text-[10px] tracking-widest">
          <div className="flex items-center gap-2">
            <IndianRupee size={14} /> Opening Stock & Rate
          </div>
          <div className="h-px bg-slate-600 flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-6 relative z-0">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Opening Qty
            </label>
            <input
              name="openingQty"
              type="number"
              step="0.01"
              defaultValue={item.openingQty || 0}
              className="w-full h-12 px-4 bg-white/10 border border-white/10 rounded-xl text-white font-mono font-bold focus:bg-white/20 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Rate (per unit)
            </label>
            <input
              name="openingRate"
              type="number"
              step="0.01"
              defaultValue={item.openingRate || 0}
              className="w-full h-12 px-4 bg-white/10 border border-white/10 rounded-xl text-white font-mono font-bold focus:bg-white/20 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-4 pt-4 relative z-0">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="flex-1 h-14 flex items-center justify-center border border-slate-200 rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-blue-100"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isPending ? "Updating..." : "Update Stock Item"}
        </button>
      </div>
    </form>
  );
}
