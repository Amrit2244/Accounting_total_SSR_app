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
    <div className="max-w-2xl mx-auto p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            <UploadCloud size={32} /> Import Data
          </h1>
          <p className="text-sm text-gray-500">
            Migrate from Tally Prime/ERP 9
          </p>
        </div>
        <Link
          href={`/companies/${id}`}
          className="text-sm font-bold text-gray-500 hover:text-[#003366] flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8">
        {/* ✅ SUCCESS MESSAGE (UPDATED) */}
        {state?.success && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-green-100 p-2 rounded-full text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-green-800 font-bold">Import Successful!</h3>
              {/* This will now show "Imported: X Groups, Y Ledgers..." */}
              <p className="text-green-700 text-sm font-medium">
                {state.message}
              </p>
            </div>
            <Link
              href={`/companies/${id}/vouchers`}
              className="ml-auto bg-green-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-green-700"
            >
              View Data
            </Link>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-red-600" />
            <span className="text-red-700 font-bold text-sm">
              {state.error}
            </span>
          </div>
        )}

        {/* FORM */}
        {!state?.success && (
          <form action={action} className="space-y-6">
            <input type="hidden" name="companyId" value={id} />

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
              <input
                type="file"
                name="xmlFile"
                accept=".xml,.txt" // ✅ Accepts XML and Text files
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <FileCode size={32} className="text-[#003366]" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">
                Click to Upload
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Supported: Tally XML or .txt (UTF-8)
              </p>
            </div>

            <button
              disabled={isPending}
              className="w-full bg-[#003366] hover:bg-[#002244] text-white py-4 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
              {isPending ? "Processing..." : "Start Import"}
            </button>
          </form>
        )}

        {/* INSTRUCTIONS */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
            Steps for Tally Migration:
          </h4>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-4">
            <li>
              <b>Step 1:</b> Export "Masters" (Groups & Ledgers) from Tally.
              Upload it here first.
            </li>
            <li>
              <b>Step 2:</b> Export "Daybook" (Vouchers). Upload it second.
            </li>
            <li>
              If you get errors, save the XML file as <b>UTF-8</b> in Notepad.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
