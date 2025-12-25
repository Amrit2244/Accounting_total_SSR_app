"use client";

import { useState, use } from "react";
import {
  UploadCloud,
  Loader2,
  FileCode,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Database,
  ChevronRight,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Local state instead of useActionState
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);

    try {
      // Fetch the API route
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Import failed");
      }

      setStatus({ type: "success", msg: data.message || "Import Successful!" });
      router.refresh(); // Refresh dashboard data
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${id}`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Database size={22} className="text-indigo-600" />
                Data Migration
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-slate-900">Import XML</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />

          {/* SUCCESS MESSAGE */}
          {status?.type === "success" && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-emerald-900 font-bold text-sm uppercase tracking-wide">
                  Import Complete
                </h3>
                <p className="text-emerald-700 text-xs font-medium mt-1 leading-relaxed">
                  {status.msg}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/companies/${id}/vouchers`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    View Transactions <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {status?.type === "error" && (
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="text-rose-600 shrink-0" size={20} />
              <p className="text-rose-700 text-xs font-bold">{status.msg}</p>
            </div>
          )}

          {/* UPLOAD FORM */}
          {status?.type !== "success" && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="companyId" value={id} />

                <div className="relative group">
                  <input
                    type="file"
                    name="xmlFile"
                    accept=".xml,.txt"
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                    required
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center bg-slate-50/50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300 transition-all duration-300">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-indigo-600 border border-slate-100 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                      Click to Upload Tally XML
                    </h3>
                    <p className="text-slate-500 text-xs mt-2 max-w-xs">
                      Drag and drop your file here, or click to browse.
                    </p>
                    <div className="mt-4 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase text-slate-500 border border-slate-200">
                      Supports Large Files (50MB+)
                    </div>
                  </div>
                </div>

                <button
                  disabled={isPending}
                  className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing Data...</span>
                    </>
                  ) : (
                    <>
                      <FileCode size={16} />
                      <span>Start Migration</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* INSTRUCTIONS */}
          <div className="bg-slate-50 border-t border-slate-100 p-5 flex gap-3">
            <Info className="text-slate-400 shrink-0" size={18} />
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">
                System Note
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This migration tool is optimized for Tally Prime XML exports.
                The system automatically handles large datasets in chunks to
                prevent timeouts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
