import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  LogOut,
  Calendar,
  ChevronDown,
  Hexagon,
  Search,
  ShieldCheck,
  TrendingUp,
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Gradient Fade */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-white via-white/90 to-transparent z-0 pointer-events-none" />

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 px-6 h-20 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-200">
            <Hexagon size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
              FinCore
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {currentUser.role}
                </span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="group flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 max-w-6xl mx-auto py-12 px-6">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-4">
              <TrendingUp size={12} /> Enterprise Edition
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Select Organization
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Welcome back. Choose a workspace below to access your financial
              ledgers, vouchers, and manufacturing data.
            </p>
          </div>

          <Link
            href="/companies/create"
            className="group relative inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Organization</span>
          </Link>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map((company: any) => {
            const baseYear = new Date(company.financialYearFrom).getFullYear();
            const currentYear = new Date().getFullYear();

            // Logic to determine available fiscal years
            const availableYears = [];
            for (let y = currentYear; y >= baseYear; y--) {
              availableYears.push(y);
            }

            return (
              <div
                key={company.id}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Decorative Top Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-7 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-300">
                      <Building2 size={24} strokeWidth={1.5} />
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                      <ShieldCheck size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {company.name}
                  </h2>

                  <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="px-2 py-1 rounded bg-slate-100">
                      {company.state || "Global"}
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-100">
                      {company.gstin ? "GST Reg" : "Non-GST"}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-7 py-5 bg-slate-50 border-t border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                  <form action={selectCompanyAction} className="flex gap-3">
                    <input type="hidden" name="companyId" value={company.id} />

                    {/* Styled Select */}
                    <div className="relative flex-1">
                      <Calendar
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        name="fyYear"
                        required
                        className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 uppercase tracking-wide appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                      >
                        {availableYears.map((year: number) => (
                          <option key={year} value={year}>
                            FY {year} - {year + 1}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>

                    {/* Arrow Button */}
                    <button
                      type="submit"
                      className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 shadow-sm transition-all duration-300"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}

          {/* Empty State Card */}
          {companies.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <Search className="text-slate-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No Companies Found
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">
                You haven't created any organizations yet. Start by adding your
                first company to manage finances.
              </p>
              <Link
                href="/companies/create"
                className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:text-indigo-800 transition-colors"
              >
                <Plus size={16} /> Create Company
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
