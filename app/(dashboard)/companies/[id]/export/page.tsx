import { prisma } from "@/lib/prisma";
import { FileDown, ShieldAlert, ArrowLeft } from "lucide-react";
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-md text-white">
            <FileDown size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Data Export Hub
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Backups & External Audits
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${id}`}
          className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </div>

      {/* COMPACT BUTTONS CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <ExportHub companyId={companyId} />
      </div>

      {/* SECURITY NOTE */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
        <ShieldAlert className="text-amber-600 shrink-0" size={18} />
        <div>
          <p className="text-[11px] text-amber-900 font-bold uppercase mb-1">
            Security Protocol
          </p>
          <p className="text-[11px] text-amber-800 font-medium leading-tight">
            Exported files contain unencrypted financial records. Ensure these
            files are stored in a password-protected environment and deleted
            from public downloads after use.
          </p>
        </div>
      </div>
    </div>
  );
}
