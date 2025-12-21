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
      // ✅ Fetch the API route to bypass size limit
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
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* HEADER */}
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* SUCCESS MESSAGE */}
        {status?.type === "success" && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-4 animate-in fade-in">
            <CheckCircle className="text-emerald-600 shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-emerald-900 font-black text-xs uppercase">
                Success!
              </h3>
              <p className="text-emerald-700 text-[11px] font-medium leading-tight">
                {status.msg}
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
        {status?.type === "error" && (
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 animate-in fade-in">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            <p className="text-rose-700 text-[11px] font-bold uppercase">
              {status.msg}
            </p>
          </div>
        )}

        {/* UPLOAD FORM */}
        {status?.type !== "success" && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    Supports Large Files (50MB+)
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
                {isPending ? "Uploading & Processing..." : "Execute Migration"}
              </button>
            </form>
          </div>
        )}

        {/* INSTRUCTIONS */}
        <div className="bg-slate-50 border-t border-slate-100 p-5">
          <div className="bg-amber-100/50 border border-amber-200 p-3 rounded-xl">
            <p className="text-[10px] text-amber-800 font-medium leading-tight italic">
              This new system supports large 11MB+ files automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
