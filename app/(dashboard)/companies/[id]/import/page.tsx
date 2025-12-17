"use client";

import { useActionState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, action, isPending] = useActionState(importTallyXML, undefined);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* 1. HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${id}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Data Migration</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="text-blue-600" /> Import Tally Data
          </h1>
          <p className="text-slate-500 mt-1 max-w-lg">
            Migrate your Groups, Ledgers, and Vouchers from Tally Prime/ERP 9
            using XML export.
          </p>
        </div>
        <Link
          href={`/companies/${id}`}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Cancel Import
        </Link>
      </div>

      {/* 2. MAIN CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* SUCCESS MESSAGE */}
        {state?.success && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
              <CheckCircle size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-emerald-900 font-bold text-lg">
                Import Successful!
              </h3>
              <p className="text-emerald-700 text-sm mt-1 leading-relaxed">
                {state.message}
              </p>
            </div>
            <Link
              href={`/companies/${id}/vouchers`}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md transition-all whitespace-nowrap"
            >
              View Data
            </Link>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {state?.error && (
          <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-rose-100 p-2 rounded-full text-rose-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-rose-900 font-bold">Import Failed</h3>
              <p className="text-rose-700 text-sm mt-1">{state.error}</p>
            </div>
          </div>
        )}

        {/* UPLOAD FORM */}
        {!state?.success && (
          <div className="p-8">
            <form action={action} className="space-y-6">
              <input type="hidden" name="companyId" value={id} />

              {/* Drag & Drop Area */}
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  name="xmlFile"
                  accept=".xml,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                  required
                />
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 transition-all group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:scale-[1.01]">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                    Click to Upload or Drag File Here
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs">
                    Supported Formats: Tally XML export or .txt (UTF-8 encoded)
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  disabled={isPending}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <FileCode size={18} />
                  )}
                  {isPending ? "Processing Data..." : "Start Import Process"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INSTRUCTIONS FOOTER */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 md:p-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={14} /> Migration Guide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="text-sm text-slate-600">
                  <strong className="text-slate-800 block mb-0.5">
                    Export Masters First
                  </strong>
                  Export "Groups & Ledgers" from Tally and upload this file
                  first. This creates the account structure.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="text-sm text-slate-600">
                  <strong className="text-slate-800 block mb-0.5">
                    Export Vouchers Second
                  </strong>
                  Export "Daybook" (All Vouchers) and upload it second. This
                  populates the transactions.
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-bold mb-1 flex items-center gap-2">
                <AlertTriangle size={14} /> Important Note:
              </p>
              If you encounter encoding errors, open the XML file in Notepad,
              select <strong>File &gt; Save As</strong>, and change encoding to{" "}
              <strong>UTF-8</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
