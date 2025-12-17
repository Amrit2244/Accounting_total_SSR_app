import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { Search, Bell, ChevronRight } from "lucide-react";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Company Name for the Header
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, id: true },
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* 1. SIDEBAR (Fixed Left) */}
      {/* We use the new Sidebar component which handles its own styling and 'aside' tag */}
      <Sidebar companyId={companyId} />

      {/* 2. MAIN CONTENT AREA (Flex Grow) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* HEADER: Modern Sticky Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          {/* LEFT: Breadcrumb / Context */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span className="uppercase tracking-wider font-semibold">
                Workspace
              </span>
              <ChevronRight size={12} />
              <span>ID: {company?.id.toString().padStart(4, "0")}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {company?.name || "Company Dashboard"}
            </h1>
          </div>

          {/* RIGHT: Global Search & Notifications */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="hidden md:flex relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                className="h-9 w-64 pl-10 pr-4 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notification Icon */}
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Company Initial Avatar */}
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/20">
              {company?.name?.[0]?.toUpperCase() || "C"}
            </div>
          </div>
        </header>

        {/* 3. SCROLLABLE CONTENT CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {/* Container to center content on ultra-wide screens */}
          <div className="max-w-[1600px] mx-auto min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
