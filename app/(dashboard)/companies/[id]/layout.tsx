import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import AutoLogout from "@/components/AutoLogout";
import { Search, Bell, ChevronRight, Clock, Building2 } from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

// Force dynamic rendering since we rely on cookies and params
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // ✅ 1. Await params to extract the ID safely
  const { id } = await params;
  const companyId = parseInt(id);

  // ✅ 2. Validate ID
  if (isNaN(companyId)) {
    redirect("/dashboard");
  }

  // --- User Session Logic ---
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let user = null;

  if (session) {
    try {
      const secret =
        process.env.SESSION_SECRET || "your-super-secret-key-change-this";
      const encodedKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(session, encodedKey);

      if (payload?.userId) {
        const userIdInt =
          typeof payload.userId === "string"
            ? parseInt(payload.userId)
            : (payload.userId as number);
        user = await prisma.user.findUnique({
          where: { id: userIdInt },
          select: { name: true },
        });
      }
    } catch (e) {
      redirect("/login");
    }
  } else {
    redirect("/login");
  }

  // ✅ 3. Fetch Company safely
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, id: true },
  });

  if (!company) {
    redirect("/dashboard");
  }

  // --- Search Action ---
  async function handleSearch(formData: FormData) {
    "use server";
    const query = formData.get("search");
    if (query) {
      redirect(
        `/companies/${companyId}/vouchers?search=${encodeURIComponent(
          query.toString()
        )}`
      );
    }
  }

  // Current Time for Header
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
      <AutoLogout />

      {/* Sidebar Navigation */}
      <Sidebar companyId={companyId} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-slate-50/30">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* --- HEADER --- */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-20 relative">
          {/* Company Identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Building2 size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-none">
                {company.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                <span>Workspace</span>
                <ChevronRight size={10} />
                <span className="font-mono text-slate-500">
                  #{company.id.toString().padStart(4, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form
            action={handleSearch}
            className="hidden xl:flex relative group w-96"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              size={16}
            />
            <input
              name="search"
              type="text"
              placeholder="Search vouchers, ledgers, or items..."
              className="h-10 w-full pl-10 pr-4 bg-slate-100/50 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="text-[10px] font-bold text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </div>
          </form>

          {/* Right Controls */}
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-4 pr-5 border-r border-slate-200">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {user?.name || "Guest User"}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center justify-end gap-1 mt-0.5 tracking-wide">
                  <Clock size={10} /> {currentTime}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-900/20">
                {user?.name?.[0] || "U"}
              </div>
            </div>

            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* --- CONTENT SCROLL AREA --- */}
        <div className="flex-1 overflow-y-auto relative z-10 scroll-smooth custom-scrollbar">
          {/* Wrapper to center content on ultra-wide screens */}
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
