import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Bell,
  ChevronRight,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";

// Force dynamic rendering to ensure session is checked on every load
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // --- AUTH & USER FETCHING ---
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  let user = null;
  let sessionError = false;

  if (!session) {
    sessionError = true;
  } else {
    try {
      // Use the same fallback as your auth action to ensure consistency
      const secret =
        process.env.SESSION_SECRET || "your-super-secret-key-change-this";
      const encodedKey = new TextEncoder().encode(secret);

      const { payload } = await jwtVerify(session, encodedKey);

      if (payload && payload.userId) {
        const userIdInt =
          typeof payload.userId === "string"
            ? parseInt(payload.userId)
            : (payload.userId as number);

        user = await prisma.user.findUnique({
          where: { id: userIdInt },
          select: { name: true },
        });

        if (!user) sessionError = true;
      }
    } catch (e) {
      console.error("JWT Auth Failed in Layout:", e);
      sessionError = true;
    }
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, id: true },
  });

  // --- SEARCH HANDLER ---
  async function handleSearch(formData: FormData) {
    "use server";
    const query = formData.get("search");
    if (query) {
      // Redirect to the daybook/voucher list with the search parameter
      redirect(
        `/companies/${companyId}/vouchers?search=${encodeURIComponent(
          query.toString()
        )}`
      );
    }
  }

  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar companyId={companyId} />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          {/* LEFT: Context */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="uppercase tracking-wider font-semibold">
                Workspace
              </span>
              <ChevronRight size={12} />
              <span>ID: {company?.id.toString().padStart(4, "0")}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {company?.name || "Dashboard"}
            </h1>
          </div>

          {/* MIDDLE: Search (Functional) */}
          <form action={handleSearch} className="hidden lg:flex relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={16}
            />
            <input
              name="search"
              type="text"
              placeholder="Search Trans ID or Vch No..."
              className="h-10 w-80 pl-10 pr-4 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </form>

          {/* RIGHT: User & Session */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              {sessionError ? (
                <Link
                  href="/login"
                  className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-red-100 hover:bg-red-200 transition-colors"
                >
                  <AlertCircle size={12} /> SESSION EXPIRED - LOGIN AGAIN
                </Link>
              ) : (
                <>
                  <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <User size={14} className="text-blue-600" />
                    {user?.name || "Unknown User"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    <Clock size={10} /> {currentTime}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg uppercase">
                {user?.name?.[0] || "?"}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
