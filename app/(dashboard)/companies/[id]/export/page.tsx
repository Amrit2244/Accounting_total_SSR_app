import { prisma } from "@/lib/prisma";
import { FileDown, ShieldAlert } from "lucide-react";
import ExportHub from "@/components/ExportHub";

export default async function ExportUtilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-8">
      <div className="flex items-center gap-4 border-b pb-8">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <FileDown className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Data Export Hub
          </h1>
          <p className="text-slate-500 font-medium">
            Export full company records for backups or external audits.
          </p>
        </div>
      </div>

      {/* The Working Buttons Component */}
      <ExportHub companyId={companyId} />

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
        <ShieldAlert className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <strong>Security Note:</strong> Exported files contain sensitive
          financial data. Ensure you store these backups in a secure, encrypted
          location.
        </p>
      </div>
    </div>
  );
}
