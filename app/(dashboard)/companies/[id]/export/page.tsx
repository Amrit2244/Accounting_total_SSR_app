import { prisma } from "@/lib/prisma";
import { FileDown, ShieldAlert, ArrowLeft, ChevronRight } from "lucide-react";
import ExportHub from "@/components/ExportHub";
import Link from "next/link";

export default async function ExportUtilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

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

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileDown size={22} className="text-indigo-600" />
                Data Export Hub
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-slate-900">Utilities</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-1">
          {/* Render the Client Component */}
          <ExportHub companyId={companyId} />
        </div>

        {/* SECURITY NOTE */}
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
          <div className="p-2 bg-white border border-amber-100 rounded-lg text-amber-600 shadow-sm">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-1">
              Security Protocol
            </h4>
            <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-2xl">
              Exported files contain sensitive financial records in plain text
              formats (JSON/CSV). Ensure these files are stored in a
              password-protected environment and deleted from public downloads
              after use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
