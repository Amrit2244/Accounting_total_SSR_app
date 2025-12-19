"use client";

import { useActionState } from "react";
import { createLedger } from "@/app/actions/masters";
import {
  BookOpen,
  Layers,
  IndianRupee,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type Group = { id: number; name: string; nature: string | null };

// ✅ FIX: Pass both arguments to the server action to match its signature
async function createLedgerWrapper(prevState: any, formData: FormData) {
  return await createLedger(prevState, formData);
}

// ✅ FIX: Define a proper initial state object instead of 'undefined'
// to prevent "Object is possibly null" errors in the UI
const initialState = {
  success: false,
  message: "",
  errors: {},
};

export default function CreateLedgerForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  const [state, action, isPending] = useActionState(
    createLedgerWrapper,
    initialState
  );

  return (
    <form action={action} className="space-y-4 font-sans">
      <input type="hidden" name="companyId" value={companyId} />

      {/* ✅ Updated to check state.message or specific error keys based on your master action */}
      {state?.message && !state.success && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={12} /> {state.message}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={12} /> Ledger Created!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Ledger Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <BookOpen
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="name"
              required
              placeholder="e.g. HDFC Bank"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Group <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Layers
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              name="groupId"
              required
              defaultValue=""
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select...
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.nature || "Group"})
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
              defaultValue={0}
              className="w-full h-9 px-3 bg-white/10 border border-white/10 rounded-lg text-white font-mono text-sm font-bold text-right outline-none focus:bg-white/20"
            />
          </div>
          <div className="col-span-4">
            <select
              name="balanceType"
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

      <div className="pt-2 flex justify-end">
        <button
          disabled={isPending}
          type="submit"
          className="bg-[#003366] hover:bg-black text-white px-6 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          CREATE LEDGER
        </button>
      </div>
    </form>
  );
}
