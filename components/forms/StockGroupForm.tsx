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

type Group = {
  id: number;
  name: string;
};

export default function StockGroupForm({
  companyId,
  existingGroups,
}: {
  companyId: number;
  existingGroups: Group[];
}) {
  const [state, action, isPending] = useActionState(
    createStockGroup,
    undefined
  );

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
          <span>Stock Group saved successfully!</span>
        </div>
      )}

      {/* Group Name */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Group Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FolderOpen size={18} />
          </div>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Electronics, Raw Materials"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Parent Group */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Parent Group
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FolderTree size={18} />
          </div>
          <select
            name="parentId"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer font-medium"
          >
            <option value="">(Primary)</option>
            {existingGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {/* Custom Chevron */}
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
        <p className="text-xs text-slate-500 mt-1">
          Select "Primary" if this is a main category.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Save Group
            </>
          )}
        </button>
      </div>
    </form>
  );
}
