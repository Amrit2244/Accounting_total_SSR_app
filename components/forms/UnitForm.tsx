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
    <form action={action} className="space-y-4 font-sans">
      <input type="hidden" name="companyId" value={companyId} />

      {state?.message && !state.success && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <AlertCircle size={12} /> {state.message}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <CheckCircle size={12} /> Unit Created!
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">
          Symbol *
        </label>
        <div className="relative">
          <Tag
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            name="symbol"
            required
            placeholder="e.g. kg"
            className="w-full h-10 pl-9 border rounded-xl bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">
          Formal Name *
        </label>
        <div className="relative">
          <Scale
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            name="name"
            required
            placeholder="e.g. Kilograms"
            className="w-full h-10 pl-9 border rounded-xl bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
          className="bg-[#003366] text-white px-6 h-10 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          SAVE UNIT
        </button>
      </div>
    </form>
  );
}
