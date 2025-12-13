import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { logout } from "@/app/actions/auth"; // ✅ Imports from your existing auth file

// Ensure this matches the secret used in your @/lib/session file
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
      // Verify token and extract User ID
      const { payload } = await jwtVerify(session, encodedKey);

      // Handle ID whether it's stored as 'userId' or 'sub'
      const userIdStr = (payload.userId || payload.sub) as string;
      const userId = parseInt(userIdStr);

      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, username: true, role: true },
        });
      }
    } catch (e) {
      console.log("Session verification failed or expired");
    }
  }

  // 2. FETCH COMPANIES
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* --- TOP BAR: USER INFO & LOGOUT --- */}
      {currentUser && (
        <div className="flex flex-col sm:flex-row justify-end items-center mb-8 gap-4 sm:gap-6 border-b border-gray-100 pb-4">
          {/* User Badge */}
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center text-white">
              <UserIcon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#003366] leading-none">
                {currentUser.name || currentUser.username}
              </p>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-blue-400" />
                <p className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">
                  {currentUser.role || "User"}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button (Uses your existing Server Action) */}
          <form action={logout}>
            <button className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-white bg-white border border-red-200 hover:bg-red-600 px-4 py-2 rounded-full transition-all shadow-sm">
              <LogOut size={14} /> LOGOUT
            </button>
          </form>
        </div>
      )}

      {/* --- WELCOME HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#003366]">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your organizations and financial records
          </p>
        </div>
        <Link
          href="/companies/create"
          className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-900 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
        >
          <Plus size={18} /> New Company
        </Link>
      </div>

      {/* --- COMPANY GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all hover:border-[#003366] group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-[#003366] rounded-lg group-hover:bg-[#003366] group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-[#003366] transition-colors" />
            </div>

            <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#003366] transition-colors">
              {company.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {company.state || "Location N/A"} • {company.gstin || "No Tax ID"}
            </p>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>
                FY: {new Date(company.financialYearFrom).getFullYear()} -{" "}
                {new Date(company.financialYearFrom).getFullYear() + 1}
              </span>
            </div>
          </Link>
        ))}

        {/* Empty State */}
        {companies.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-16 px-6 bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600">
              No Companies Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Get started by creating your first entity.
            </p>
            <Link
              href="/companies/create"
              className="text-blue-600 font-bold hover:underline"
            >
              Create Company &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
