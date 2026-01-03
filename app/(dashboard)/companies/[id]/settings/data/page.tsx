import { prisma } from "@/lib/prisma";
import DataManagementUI from "./DataManagementUI";
import { ShieldAlert, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  const logs = await prisma.dataActivityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 15,
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            System
          </Link>
          <ChevronRight size={10} />
          <span className="text-slate-900">Maintenance</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <ShieldAlert className="text-indigo-600" size={36} />
              Data Management
            </h1>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">
              Execute system-level backups and disaster recovery protocols. Use
              these tools with extreme caution.
            </p>
          </div>
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
            Secure-Kernel v1.2
          </div>
        </div>
      </div>

      <DataManagementUI initialLogs={logs} />

      <div className="max-w-5xl mx-auto mt-12 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Authorized Personnel Only • All Operations are Geotagged & Logged
        </p>
      </div>
    </div>
  );
}
