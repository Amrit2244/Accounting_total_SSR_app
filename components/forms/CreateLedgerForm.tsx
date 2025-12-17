"use client";

import { useActionState } from "react";
import { createLedger } from "@/app/actions/masters";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  IndianRupee,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

type Group = {
  id: number;
  name: string;
  nature: string;
};

export default function CreateLedgerForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  const [state, action, isPending] = useActionState(createLedger, undefined);

  return (
    <form action={action} className="space-y-6">
      {/* --- STATUS BANNERS --- */}
      {state?.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-lg flex items-start gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>Ledger created successfully!</span>
        </div>
      )}

      <input type="hidden" name="companyId" value={companyId} />

      {/* 1. Name Input */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Ledger Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <BookOpen size={18} />
          </div>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. HDFC Bank, Amit Traders"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 2. Group Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Under Group <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Layers size={18} />
          </div>
          <select
            name="groupId"
            required
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer font-medium"
            defaultValue=""
          >
            <option value="" disabled>
              -- Select Group --
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.nature})
              </option>
            ))}
          </select>
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
      </div>

      <hr className="border-slate-100" />

      {/* 3. Opening Balance Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Opening Balance (₹)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IndianRupee size={16} />
            </div>
            <input
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue={0}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-right focus:ring-2 focus:ring-blue-600 outline-none font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Dr / Cr
          </label>
          <select
            name="balanceType"
            className="w-full px-2 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none font-medium cursor-pointer"
          >
            <option value="Dr">Dr</option>
            <option value="Cr">Cr</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href={`/companies/${companyId}/chart-of-accounts`}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Create Ledger
            </>
          )}
        </button>
      </div>
    </form>
  );
}
