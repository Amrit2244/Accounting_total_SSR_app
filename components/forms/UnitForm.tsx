"use client";

import { useActionState } from "react";
import { createUnit } from "@/app/actions/masters"; // Ensure this action exists
import {
  Scale,
  Tag,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function UnitForm({ companyId }: { companyId: number }) {
  const [state, action, isPending] = useActionState(createUnit, undefined);

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
          <span>Unit created successfully!</span>
        </div>
      )}

      {/* 1. Symbol Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="symbol"
          className="block text-sm font-medium text-slate-700"
        >
          Symbol <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Tag size={18} />
          </div>
          <input
            id="symbol"
            name="symbol"
            type="text"
            required
            placeholder="e.g. kg, pcs, mtr, box"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Short representation (appears in invoices).
        </p>
      </div>

      {/* 2. Formal Name Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Formal Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Scale size={18} />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Kilograms, Pieces, Meters"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href={`/companies/${companyId}/inventory/units`}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Save Unit
            </>
          )}
        </button>
      </div>
    </form>
  );
}
