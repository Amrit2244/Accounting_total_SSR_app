import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Link from "next/link";
import { Plus, LogOut, User, Building2, Briefcase } from "lucide-react";
import { logout } from "@/app/actions/auth";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey);
    if (payload.userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(payload.userId as string) },
        select: { name: true, username: true, role: true },
      });
      return {
        name: user?.name || "Unknown",
        username: user?.username,
        role: user?.role,
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

export default async function BankingGateway() {
  const user = await getSessionUser();
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { vouchers: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 1. BANKING TOP BAR */}
      <header className="bg-[#003366] text-white h-12 flex items-center justify-between px-4 shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1 rounded">
            <Building2 size={18} />
          </div>
          <span className="font-bold tracking-wide text-sm">
            FINACLE CORE <span className="text-blue-300">| GATEWAY</span>
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-blue-200">User:</span>
            <span className="font-bold uppercase">
              {user?.name} ({user?.role})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-200">Last Login:</span>
            <span className="font-mono">12-DEC-2025 18:30:00</span>
          </div>
          <form action={logout}>
            <button className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-white font-bold transition-colors flex items-center gap-1">
              <LogOut size={12} /> LOGOUT
            </button>
          </form>
        </div>
      </header>

      {/* 2. SUB-HEADER (Breadcrumbs/Actions) */}
      <div className="bg-white border-b border-gray-300 h-10 flex items-center px-4 justify-between shadow-sm">
        <span className="text-xs font-bold text-gray-600 uppercase">
          System / Organization Selection
        </span>
        <Link
          href="/companies/create"
          className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1"
        >
          <Plus size={14} /> CREATE NEW ENTITY
        </Link>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create Card (Styled as a Module) */}
          <Link
            href="/companies/create"
            className="bg-gray-200 border border-gray-300 p-4 rounded flex flex-col items-center justify-center gap-2 hover:bg-gray-300 transition-colors cursor-pointer min-h-[140px] text-gray-500 hover:text-[#003366]"
          >
            <Plus size={32} strokeWidth={1.5} />
            <span className="font-bold text-sm">ADD ORGANIZATION</span>
          </Link>

          {/* Entity Cards */}
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white border-t-4 border-t-[#003366] border-x border-b border-gray-300 p-4 shadow-sm hover:shadow-md transition-all min-h-[140px] flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[#003366] text-lg leading-tight group-hover:underline">
                    {company.name}
                  </h3>
                  <Briefcase size={16} className="text-gray-400" />
                </div>
                <div className="mt-2 text-xs text-gray-500 font-medium">
                  <div>FY: {company.financialYearFrom.getFullYear()}</div>
                  <div>ID: {company.id.toString().padStart(6, "0")}</div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">
                    Volume
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {company._count.vouchers} entries
                  </span>
                </div>
                <span className="bg-[#e6f0ff] text-[#003366] px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                  ACTIVE
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. STATUS BAR */}
      <footer className="bg-gray-200 border-t border-gray-300 h-6 flex items-center px-4 text-[10px] text-gray-600 justify-between shrink-0">
        <span>System Ready.</span>
        <span>v2.0.1 Enterprise Build</span>
      </footer>
    </div>
  );
}
