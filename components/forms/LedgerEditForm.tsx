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

// ✅ 1. Define the specific state interface to satisfy TypeScript
interface LedgerUpdateState {
  success?: boolean;
  message?: string | null;
  error?: string; // Some actions use .error instead of .message
  errors?: {
    id?: string[];
    name?: string[];
    groupId?: string[];
    openingBalance?: string[];
    gstin?: string[];
    state?: string[];
    companyId?: string[];
    balanceType?: string[];
  };
}

// ✅ 2. Provide a valid initial state object instead of undefined
const initialState: LedgerUpdateState = {
  success: false,
  message: null,
  errors: {},
};

// ✅ 3. Use a wrapper to ensure both arguments (prevState, formData) are passed
async function updateLedgerWrapper(
  prevState: LedgerUpdateState,
  formData: FormData
): Promise<LedgerUpdateState> {
  const result = await updateLedger(prevState, formData);
  return result as LedgerUpdateState;
}

export default function LedgerEditForm({ companyId, ledger, groups }: any) {
  // ✅ 4. Use the wrapper and typed initial state
  const [state, action, isPending] = useActionState(
    updateLedgerWrapper,
    initialState
  );

  const isCr = ledger.openingBalance < 0;
  const absBalance = Math.abs(ledger.openingBalance);

  return (
    <form action={action} className="space-y-6 font-sans p-1">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="id" value={ledger.id} />

      {/* --- STATUS MESSAGES --- */}
      {(state?.message || (state as any)?.error) && !state.success && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <AlertCircle size={16} /> {state.message || (state as any).error}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle size={16} /> Ledger Updated Successfully!
        </div>
      )}

      {/* --- MAIN FORM --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ledger Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Ledger Name
          </label>
          <div className="relative group">
            <BookOpen
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="name"
              type="text"
              defaultValue={ledger.name}
              required
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Parent Group */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Account Group
          </label>
          <div className="relative group">
            <Layers
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <select
              name="groupId"
              defaultValue={ledger.groupId}
              className="w-full h-11 pl-10 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer transition-all"
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

      {/* --- OPENING BALANCE (Dark Card) --- */}
      <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
        {/* Decorative Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-500" />

        <div className="flex items-center gap-2 mb-3 text-blue-400 font-black uppercase text-[10px] tracking-widest relative z-10">
          <IndianRupee size={14} /> Opening Balance Configuration
        </div>

        <div className="grid grid-cols-12 gap-4 relative z-10">
          <div className="col-span-8">
            <input
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue={absBalance}
              className="w-full h-10 px-4 bg-white/10 border border-white/10 rounded-xl text-white font-mono text-lg font-bold text-right outline-none focus:bg-white/20 focus:border-blue-500/50 transition-all placeholder:text-white/30"
            />
          </div>
          <div className="col-span-4">
            <select
              name="balanceType"
              defaultValue={isCr ? "Cr" : "Dr"}
              className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/10 text-white text-xs font-bold uppercase tracking-wide outline-none cursor-pointer hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value="Dr" className="text-slate-900 font-bold">
                Debit
              </option>
              <option value="Cr" className="text-slate-900 font-bold">
                Credit
              </option>
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
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
