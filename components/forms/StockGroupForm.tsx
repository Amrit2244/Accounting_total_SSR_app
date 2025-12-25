"use client";

import { useActionState } from "react";
import { createStockGroup } from "@/app/actions/masters";
import {
  FolderTree,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  FolderOpen,
} from "lucide-react";

// ✅ 1. Define the specific state interface
interface StockGroupState {
  success?: boolean;
  message?: string | null;
  error?: string;
  errors?: {
    name?: string[];
    companyId?: string[];
    parentId?: string[];
  };
}

// ✅ 2. Provide a valid initial state object
const initialState: StockGroupState = {
  success: false,
  message: null,
};

// ✅ 3. Wrapper function to handle the (prevState, formData) signature
async function createStockGroupWrapper(
  prevState: StockGroupState,
  formData: FormData
): Promise<StockGroupState> {
  const result = await createStockGroup(prevState, formData);
  return result as StockGroupState;
}

export default function StockGroupForm({
  companyId,
  existingGroups,
}: {
  companyId: number;
  existingGroups: any[];
}) {
  // ✅ 4. Use the wrapper and typed initial state
  const [state, action, isPending] = useActionState(
    createStockGroupWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-6 font-sans p-1">
      <input type="hidden" name="companyId" value={companyId} />

      {/* --- STATUS MESSAGES --- */}
      {(state?.message || (state as any)?.error) && !state.success && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <AlertCircle size={16} /> {state.message || (state as any).error}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle size={16} /> Stock Group Created Successfully!
        </div>
      )}

      {/* --- FORM FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Group Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Group Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <FolderOpen
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Finished Goods"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          {state?.errors?.name && (
            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Parent Group */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Parent Group
          </label>
          <div className="relative group">
            <FolderTree
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <select
              name="parentId"
              className="w-full h-11 pl-10 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="">(Primary)</option>
              {existingGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- ACTION BUTTON --- */}
      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
          type="submit"
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
          <span>Create Group</span>
        </button>
      </div>
    </form>
  );
}
