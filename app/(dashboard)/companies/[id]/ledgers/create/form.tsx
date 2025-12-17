"use client";

import { useActionState } from "react";
import { createLedger } from "@/app/actions/masters";
import Link from "next/link";
import { Save, XCircle, ChevronDown, IndianRupee } from "lucide-react";

type Group = {
  id: number;
  name: string;
};

export default function CreateLedgerForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  // Matches the createLedger action in masters.ts
  const [state, action, isPending] = useActionState(createLedger, undefined);

  return (
    <form action={action} className="space-y-8">
      {state?.message && !state.success && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 font-bold flex items-center gap-3 animate-shake">
          <XCircle size={18} />
          {state.message}
        </div>
      )}

      {/* Hidden Company ID */}
      <input type="hidden" name="companyId" value={companyId} />

      <div className="grid gap-8">
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
            Ledger Name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. HDFC Current Account"
            className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Group Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
            Under Group
          </label>
          <div className="relative">
            <select
              name="groupId"
              className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold appearance-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
              required
            >
              <option value="">Select an account group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
          </div>
        </div>

        {/* Opening Balance Section */}
        <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <IndianRupee size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Opening Balance Configuration
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full h-14 px-6 bg-white/10 border border-white/10 rounded-2xl text-white font-mono text-xl font-bold placeholder:text-white/20 focus:bg-white/20 outline-none transition-all text-right"
              />
            </div>
            <div className="col-span-4">
              <select
                name="balanceType"
                className="w-full h-14 px-4 bg-white/10 border border-white/10 rounded-2xl text-white font-black outline-none focus:bg-white/20 transition-all cursor-pointer"
              >
                <option value="Dr" className="text-black">
                  DEBIT (Dr)
                </option>
                <option value="Cr" className="text-black">
                  CREDIT (Cr)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="flex-1 h-14 flex items-center justify-center border border-slate-200 rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {isPending ? (
            "Creating Ledger..."
          ) : (
            <>
              <Save size={18} /> Create Account
            </>
          )}
        </button>
      </div>
    </form>
  );
}
