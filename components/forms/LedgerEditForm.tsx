"use client";

import { useActionState } from "react";
// Assuming updateLedger is imported correctly (now successfully exported from masters.ts)
import { updateLedger } from "@/app/actions/masters";
import {
  Save,
  AlertCircle,
  BookOpen,
  Layers,
  MapPin,
  Tag,
  IndianRupee,
  CheckCircle,
  Loader2,
} from "lucide-react";

type Props = {
  companyId: number;
  ledger: {
    id: number;
    name: string;
    groupId: number;
    openingBalance: number;
    gstin: string | null;
    state: string | null;
  };
  groups: { id: number; name: string }[];
};

export default function LedgerEditForm({ companyId, ledger, groups }: Props) {
  const [state, action, isPending] = useActionState(updateLedger, undefined);

  // Determine Dr/Cr and absolute value for display
  const isCr = ledger.openingBalance < 0;
  const absBalance = Math.abs(ledger.openingBalance);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="id" value={ledger.id} />

      {/* Error Banner */}
      {state?.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Success Banner */}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>Ledger updated successfully!</span>
        </div>
      )}

      {/* 1. Ledger Name */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Ledger Name
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <BookOpen size={18} />
          </div>
          <input
            name="name"
            type="text"
            defaultValue={ledger.name}
            required
            placeholder="e.g. SBI Bank Account"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* 2. Parent Group */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Parent Group
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Layers size={18} />
          </div>
          <select
            name="groupId"
            defaultValue={ledger.groupId}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer font-medium"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            {/* Tailwind Heroicon/SVG for dropdown arrow */}
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
      </div>

      <hr className="border-slate-100" />

      {/* 3. GST Fields */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            State (for GST)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin size={18} />
            </div>
            <input
              name="state"
              type="text"
              // Use empty string for null to ensure input is controlled
              defaultValue={ledger.state || ""}
              placeholder="e.g. Maharashtra"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            GSTIN
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Tag size={18} />
            </div>
            <input
              name="gstin"
              type="text"
              // Use empty string for null to ensure input is controlled
              defaultValue={ledger.gstin || ""}
              placeholder="27ABC..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. Opening Balance */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Opening Balance (₹)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IndianRupee size={18} />
            </div>
            <input
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue={absBalance}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-right outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
        <div className="w-24 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Dr / Cr
          </label>
          <select
            name="openingType"
            defaultValue={isCr ? "Cr" : "Dr"}
            className="w-full px-2 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
          >
            <option value="Dr">Dr</option>
            <option value="Cr">Cr</option>
          </select>
        </div>
      </div>

      {/* 5. Submit Button */}
      <div className="pt-4">
        <button
          disabled={isPending}
          type="submit"
          className="bg-blue-600 text-white w-full py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> UPDATE LEDGER
            </>
          )}
        </button>
      </div>
    </form>
  );
}
