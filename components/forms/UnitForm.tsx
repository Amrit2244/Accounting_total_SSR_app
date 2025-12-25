"use client";

import { useActionState } from "react";
import { createUnit } from "@/app/actions/masters";
import {
  Scale,
  Tag,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface UnitState {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: {
    name?: string[];
    symbol?: string[];
    companyId?: string[];
  };
}

const initialState: UnitState = { success: false };

// ✅ FIX: Wrapper
async function createUnitWrapper(
  prevState: UnitState,
  formData: FormData
): Promise<UnitState> {
  const result = await createUnit(prevState, formData);
  return result as UnitState;
}

export default function UnitForm({ companyId }: { companyId: number }) {
  const [state, action, isPending] = useActionState(
    createUnitWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-6 font-sans p-1">
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS MESSAGES --- */}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <AlertCircle size={16} /> {state.message}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle size={16} /> Unit Created Successfully!
        </div>
      )}

      {/* --- FORM FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Symbol */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Unit Symbol <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Tag
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="symbol"
              required
              placeholder="e.g. kg, pcs, box"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          {state?.errors?.symbol && (
            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
              {state.errors.symbol[0]}
            </p>
          )}
        </div>

        {/* Formal Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Formal Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <Scale
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="name"
              required
              placeholder="e.g. Kilograms, Pieces"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          {state?.errors?.name && (
            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>
      </div>

      {/* --- ACTION BUTTON --- */}
      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
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
          <span>Save Unit</span>
        </button>
      </div>
    </form>
  );
}
