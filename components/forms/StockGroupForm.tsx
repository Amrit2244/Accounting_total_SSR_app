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

export default function StockGroupForm({
  companyId,
  existingGroups,
}: {
  companyId: number;
  existingGroups: any[];
}) {
  const [state, action, isPending] = useActionState(
    createStockGroup,
    undefined
  );

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
          <CheckCircle size={12} /> Group Created!
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
          Group Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <FolderOpen
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Finished Goods"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
          Parent Group
        </label>
        <div className="relative">
          <FolderTree
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            name="parentId"
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
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

      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
          className="bg-[#003366] hover:bg-black text-white px-6 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2 transition-all"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          SAVE GROUP
        </button>
      </div>
    </form>
  );
}
