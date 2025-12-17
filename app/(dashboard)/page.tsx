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
  // 1. GET LOGGED IN USER
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
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-md shadow-blue-600/20">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            FinCore Workspace
          </span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-4">
            {/* User Profile Snippet */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                <UserIcon size={16} />
              </div>
              <div className="pr-2">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  {currentUser.name || currentUser.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {currentUser.role || "User"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <form action={logout}>
              <button
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </form>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* --- WELCOME HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Select Organization
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Choose a company to manage financial records & reports.
            </p>
          </div>
          <Link
            href="/companies/create"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={18} /> Add New Company
          </Link>
        </div>

        {/* --- COMPANY GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors"></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <Building2 size={24} />
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {company.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                    {company.state || "N/A"}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-xs">
                    {company.gstin || "No GSTIN"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">
                <span>
                  FY: {new Date(company.financialYearFrom).getFullYear()} -{" "}
                  {new Date(company.financialYearFrom).getFullYear() + 1}
                </span>
                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Dashboard
                </span>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {companies.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-20 px-6 bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Building2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No Companies Found
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                You haven't created any organizations yet. Get started by adding
                your first company entity.
              </p>
              <Link
                href="/companies/create"
                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                Create Company <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
