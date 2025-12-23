// ... imports same ...
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  LogOut,
  LayoutGrid,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { logout } from "@/app/actions/auth";
import { selectCompanyAction } from "@/app/actions/company";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export default async function SelectCompanyPage() {
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
      console.error("Dashboard session check failed");
    }
  }

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
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
          <form action={logout}>
            <button
              type="submit"
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-all"
            >
              <LogOut size={16} />
            </button>
          </form>
        )}
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Select Organization
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Choose a workspace and specific financial period.
            </p>
          </div>
          <Link
            href="/companies/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all"
          >
            <Plus size={14} /> Add New Company
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ FIXED: Added explicit : any to company mapping */}
          {companies.map((company: any) => {
            const baseYear = new Date(company.financialYearFrom).getFullYear();
            const currentYear = new Date().getFullYear();
            const availableYears = [];
            for (let y = currentYear; y >= baseYear; y--) {
              availableYears.push(y);
            }

            return (
              <div
                key={company.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                      <Building2 size={24} />
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />{" "}
                      Registered
                    </div>
                  </div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mb-1">
                    {company.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    {company.state || "India"}{" "}
                    <span className="text-slate-200">|</span>{" "}
                    {company.gstin || "GST Exempt"}
                  </p>
                </div>

                <form
                  action={selectCompanyAction}
                  className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center gap-3"
                >
                  <input type="hidden" name="companyId" value={company.id} />
                  <div className="flex-1 relative group">
                    <Calendar
                      size={12}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                    />
                    <select
                      name="fyYear"
                      required
                      className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {availableYears.map((year: number) => (
                        <option key={year} value={year}>
                          FY {year} - {year + 1}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 group"
                  >
                    Open{" "}
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
