import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ChevronLeft,
  Home,
  FileText,
  Book,
  Layers,
  Settings,
  Search,
} from "lucide-react";
import SidebarNav from "@/components/SidebarNav";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, id: true },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. BANKING SIDEBAR (Modules) */}
      <aside className="w-60 bg-white border-r border-gray-300 flex flex-col z-20">
        {/* Company Context */}
        <div className="h-12 bg-[#004b8d] text-white flex items-center px-4 shadow-sm shrink-0">
          <div className="truncate font-bold text-sm uppercase">
            {company?.name}
          </div>
        </div>
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">
          Unit ID: {company?.id.toString().padStart(6, "0")}
        </div>

        {/* Dense Menu */}
        <SidebarNav companyId={companyId} theme="banking" />

        <div className="mt-auto p-4 border-t border-gray-300 bg-gray-50">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#003366] hover:underline"
          >
            <ChevronLeft size={14} />
            EXIT MODULE
          </Link>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Function Key Bar */}
        <div className="h-10 bg-white border-b border-gray-300 flex items-center px-4 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-gray-700">CURRENT FUNCTION:</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 border border-yellow-300 rounded font-mono">
              GENERAL_LEDGER
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search Function (F3)"
              className="h-6 w-48 text-xs border border-gray-300 px-2"
            />
            <button className="bg-[#004b8d] text-white px-3 py-0.5 text-xs font-bold rounded hover:bg-blue-800">
              GO
            </button>
          </div>
        </div>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-4">
          <div className="max-w-[1600px] mx-auto bg-white border border-gray-300 shadow-sm min-h-[500px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
