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

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let user = null;
  let sessionError = false;

  if (session) {
    try {
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
      sessionError = true;
    }
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, id: true },
  });

  async function handleSearch(formData: FormData) {
    "use server";
    const query = formData.get("search");
    if (query)
      redirect(
        `/companies/${companyId}/vouchers?search=${encodeURIComponent(
          query.toString()
        )}`
      );
  }

  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      <Sidebar companyId={companyId} />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* --- COMPACT HEADER (Reduced from h-20 to h-14) --- */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-none">
              {company?.name || "Dashboard"}
            </h1>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              <span>Workspace</span>
              <ChevronRight size={8} />
              <span>ID: {company?.id.toString().padStart(4, "0")}</span>
            </div>
          </div>

          <form action={handleSearch} className="hidden lg:flex relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={14}
            />
            <input
              name="search"
              type="text"
              placeholder="Quick search..."
              className="h-8 w-60 pl-9 pr-4 bg-slate-100 border-transparent rounded-lg text-xs focus:bg-white focus:border-blue-200 outline-none transition-all"
            />
          </form>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-100">
              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block leading-none">
                  {user?.name || "Unknown"}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center justify-end gap-1 mt-1">
                  <Clock size={10} /> {currentTime}
                </span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                {user?.name?.[0] || "?"}
              </div>
            </div>

            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
