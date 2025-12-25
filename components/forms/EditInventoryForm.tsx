"use client";

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
  Barcode,
  ArrowLeft,
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
  const [state, action, isPending] = useActionState(
    updateStockItemWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-8 font-sans p-1">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS BANNERS --- */}
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

      {/* --- MASTER DATA GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Item Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Package
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={18}
            />
            <input
              name="name"
              defaultValue={item.name}
              required
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          {state.errors?.name && (
            <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Unit */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Unit <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Scale
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={18}
            />
            <select
              name="unitId"
              defaultValue={item.unitId || ""}
              required
              className="w-full h-11 pl-10 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Part Number */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Part Number / SKU
          </label>
          <div className="relative group">
            <Barcode
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={18}
            />
            <input
              name="partNumber"
              defaultValue={item.partNumber || ""}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-mono uppercase placeholder:normal-case"
              placeholder="OPTIONAL"
            />
          </div>
        </div>

        {/* Group */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Stock Group
          </label>
          <div className="relative group">
            <Layers
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={18}
            />
            <select
              name="groupId"
              defaultValue={item.groupId || ""}
              className="w-full h-11 pl-10 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
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
      </div>

      {/* --- OPENING BALANCE (Dark Card) --- */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden group">
        {/* Decorative Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-700" />

        <div className="flex items-center gap-2 mb-4 text-blue-400 font-black uppercase text-[10px] tracking-widest relative z-10">
          <IndianRupee size={12} /> Opening Balance Configuration
        </div>

        <div className="grid grid-cols-2 gap-6 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Opening Qty
            </label>
            <div className="relative">
              <Hash
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                name="openingQty"
                type="number"
                step="0.01"
                defaultValue={item.openingQty || 0}
                className="w-full h-10 pl-9 pr-4 bg-white/10 border border-white/10 rounded-xl text-white font-mono text-sm font-bold outline-none focus:bg-white/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Rate (per unit)
            </label>
            <div className="relative">
              <IndianRupee
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                name="openingRate"
                type="number"
                step="0.01"
                defaultValue={item.openingRate || 0}
                className="w-full h-10 pl-9 pr-4 bg-white/10 border border-white/10 rounded-xl text-white font-mono text-sm font-bold outline-none focus:bg-white/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex gap-4 pt-2">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="flex-1 h-12 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-slate-800 transition-all"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="flex-[2] h-12 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {isPending ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
