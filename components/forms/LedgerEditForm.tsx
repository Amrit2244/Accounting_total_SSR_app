"use client";

import { useActionState } from "react";
import { updateLedger } from "@/app/actions/masters";
import {
  Save,
  AlertCircle,
  BookOpen,
  Layers,
  CheckCircle,
  Loader2,
  IndianRupee,
} from "lucide-react";

export default function LedgerEditForm({ companyId, ledger, groups }: any) {
  const [state, action, isPending] = useActionState(updateLedger, undefined);
  const isCr = ledger.openingBalance < 0;
  const absBalance = Math.abs(ledger.openingBalance);

  return (
    <form action={action} className="space-y-4 font-sans">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="id" value={ledger.id} />

      {state?.error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <AlertCircle size={12} /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
          <CheckCircle size={12} /> Updated Successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Ledger Name
          </label>
          <div className="relative">
            <BookOpen
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="name"
              type="text"
              defaultValue={ledger.name}
              required
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Parent Group
          </label>
          <div className="relative">
            <Layers
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              name="groupId"
              defaultValue={ledger.groupId}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
            >
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl shadow-md border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-blue-400 font-black uppercase text-[9px] tracking-widest">
          <IndianRupee size={12} /> Opening Balance
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8">
            <input
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue={absBalance}
              className="w-full h-9 px-3 bg-white/10 border border-white/10 rounded-lg text-white font-mono text-sm font-bold text-right outline-none focus:bg-white/20"
            />
          </div>
          <div className="col-span-4">
            <select
              name="balanceType"
              defaultValue={isCr ? "Cr" : "Dr"}
              className="w-full h-9 px-2 rounded-lg border border-white/10 bg-white/10 text-white text-[10px] font-black outline-none cursor-pointer"
            >
              <option value="Dr" className="text-black">
                DEBIT
              </option>
              <option value="Cr" className="text-black">
                CREDIT
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          disabled={isPending}
          type="submit"
          className="bg-[#003366] text-white w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          SAVE CHANGES
        </button>
      </div>
    </form>
  );
}
