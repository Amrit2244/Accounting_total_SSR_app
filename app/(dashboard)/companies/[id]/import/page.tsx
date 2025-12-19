"use client";

import { useActionState, use } from "react";
import { importTallyXML } from "@/app/actions/tally";
import {
  UploadCloud,
  FileCode,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Database,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, action, isPending] = useActionState(importTallyXML, undefined);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* 1. HEADER SECTION (Compact) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <Link href={`/companies/${id}`} className="hover:text-blue-600">
              Dashboard
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900">Data Migration</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" size={20} /> Import Tally XML
          </h1>
        </div>
        <Link
          href={`/companies/${id}`}
          className="px-3 py-1.5 border border-slate-200 text-slate-500 font-black text-[10px] uppercase rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Cancel
        </Link>
      </div>

      {/* 2. MAIN CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* SUCCESS MESSAGE (High Density) */}
        {state?.success && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-4 animate-in fade-in">
            <CheckCircle className="text-emerald-600 shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-emerald-900 font-black text-xs uppercase">
                Success!
              </h3>
              <p className="text-emerald-700 text-[11px] font-medium leading-tight">
                {state.message}
              </p>
            </div>
            <Link
              href={`/companies/${id}/vouchers`}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-md"
            >
              View Data
            </Link>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {state?.error && (
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 animate-in fade-in">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            <p className="text-rose-700 text-[11px] font-bold uppercase">
              {state.error}
            </p>
          </div>
        )}

        {/* UPLOAD FORM (Tightened Spacing) */}
        {!state?.success && (
          <div className="p-6">
            <form action={action} className="space-y-4">
              <input type="hidden" name="companyId" value={id} />

              <div className="relative group">
                <input
                  type="file"
                  name="xmlFile"
                  accept=".xml,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                  required
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-300 transition-all">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-blue-600">
                    <UploadCloud size={28} />
                  </div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                    Select Tally Export File
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">
                    XML or UTF-8 .txt formats
                  </p>
                </div>
              </div>

              <button
                disabled={isPending}
                className="w-full py-3 bg-[#003366] hover:bg-black text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <FileCode size={16} />
                )}
                {isPending ? "Parsing Data..." : "Execute Migration"}
              </button>
            </form>
          </div>
        )}

        {/* COMPACT INSTRUCTIONS */}
        <div className="bg-slate-50 border-t border-slate-100 p-5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <FileText size={12} /> Sequential Steps
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  1
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  <strong className="text-slate-800">Masters:</strong> Upload
                  "Groups & Ledgers" first to build hierarchy.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  2
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  <strong className="text-slate-800">Daybook:</strong> Upload
                  "Transactions" second to populate entries.
                </p>
              </div>
            </div>
            <div className="bg-amber-100/50 border border-amber-200 p-3 rounded-xl">
              <p className="text-[10px] text-amber-800 font-black uppercase mb-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Tech Tip:
              </p>
              <p className="text-[10px] text-amber-800 font-medium leading-tight italic">
                If import fails, re-save your file from Notepad with encoding
                set to <b>UTF-8</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
