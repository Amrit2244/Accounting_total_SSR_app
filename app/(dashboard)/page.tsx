import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { logout } from "@/app/actions/auth";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export default async function DashboardHome() {
  // 1. GET LOGGED IN USER (Server-side)
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let currentUser = null;

  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey);
      const userIdStr = (payload.userId || payload.sub) as string;
      const userId = parseInt(userIdStr);

      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, username: true, role: true },
        });
      }
    } catch (e) {
      console.log("Session verification failed");
    }
  }

  // 2. FETCH COMPANIES
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- COMPACT TOP NAVIGATION (48px height) --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-6 h-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold">
          <div className="p-1 bg-blue-600 rounded shadow-md">
            <LayoutGrid size={14} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent text-sm uppercase tracking-tight">
            FinCore Workspace
          </span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center">
                <UserIcon size={12} />
              </div>
              <div className="pr-1">
                <p className="text-[11px] font-bold text-slate-800 leading-none">
                  {currentUser.name || currentUser.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={8} className="text-emerald-500" />
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">
                    {currentUser.role || "User"}
                  </p>
                </div>
              </div>
            </div>

            <form action={logout}>
              <button
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        )}
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Select Organization
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Choose a workspace to manage financial records.
            </p>
          </div>
          <Link
            href="/companies/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={14} /> Add New Company
          </Link>
        </div>

        {/* --- GRID (2 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 size={20} />
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                />
              </div>

              <div className="relative z-10">
                <h2 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {company.name}
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {company.state || "N/A"}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {company.gstin || "No GSTIN"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                <span>
                  FY: {new Date(company.financialYearFrom).getFullYear()} -{" "}
                  {new Date(company.financialYearFrom).getFullYear() + 1}
                </span>
                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Workspace
                </span>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {companies.length === 0 && (
            <div className="col-span-full text-center py-16 px-6 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Building2 size={32} className="mx-auto mb-3 text-slate-200" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                No Companies Found
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Get started by adding your first organization.
              </p>
              <Link
                href="/companies/create"
                className="text-blue-600 text-xs font-bold hover:underline uppercase"
              >
                Create Company →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
