import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Link from "next/link";

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
        select: { id: true, name: true, username: true, role: true },
      });

      return {
        id: user?.id,
        name: user?.name || user?.username || "User",
        role: user?.role,
        loginTime: payload.iat ? new Date(payload.iat * 1000) : new Date(),
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

export default async function Dashboard() {
  const userData = await getSessionUser();

  // Fetch companies sorted by newest
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { vouchers: true, ledgers: true, stockItems: true } },
    },
  });

  // Fetch Pending Approvals (For Checkers/Admins)
  // We check if there are any vouchers with status 'PENDING' that THIS user didn't create
  let pendingCount = 0;
  if (userData?.role === "CHECKER" || userData?.role === "ADMIN") {
    pendingCount = await prisma.voucher.count({
      where: {
        status: "PENDING",
        createdById: { not: userData.id }, // Only count items others created
      },
    });
  }

  const loginTimeFormatted = userData?.loginTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black">Dashboard</h1>
          <p className="text-gray-900 font-medium mt-1">
            Welcome,{" "}
            <span className="text-blue-700 font-bold">{userData?.name}</span>
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded border border-gray-300 uppercase">
              {userData?.role}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right text-sm text-gray-700 font-medium">
            <span className="mr-2">Logged in at:</span>
            <span className="font-mono font-bold text-black bg-gray-200 px-2 py-1 rounded border border-gray-300">
              {loginTimeFormatted}
            </span>
          </div>

          <Link
            href="/companies/create"
            className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 shadow-md transition-all flex items-center gap-2"
          >
            <span className="text-xl leading-none pb-1">+</span> Create New
            Company
          </Link>
        </div>
      </div>

      {/* PENDING APPROVALS ALERT (Only for Checkers) */}
      {pendingCount > 0 && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-bold text-yellow-800">Action Required</p>
              <p className="text-sm text-yellow-700">
                You have{" "}
                <span className="font-bold">{pendingCount} voucher(s)</span>{" "}
                waiting for verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SHORTCUT CARD */}
        <Link
          href="/companies/create"
          className="group border-2 border-dashed border-gray-400 rounded-xl p-8 flex flex-col items-center justify-center text-gray-600 hover:border-black hover:text-black hover:bg-gray-100 transition-all cursor-pointer min-h-[220px]"
        >
          <div className="h-14 w-14 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center mb-4 transition-colors">
            <span className="text-3xl font-bold text-black">+</span>
          </div>
          <span className="font-bold text-lg">Add Another Company</span>
        </Link>

        {/* COMPANIES LIST */}
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white p-6 rounded-xl shadow-md border border-gray-300 hover:shadow-lg transition-all flex flex-col justify-between min-h-[240px] relative overflow-hidden"
          >
            {/* Header Part */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-black">
                  {company.name}
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                  FY: {company.financialYearFrom.getFullYear()} -{" "}
                  {company.financialYearFrom.getFullYear() + 1}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-100">
                  {company._count.vouchers} Vouchers
                </span>
                <span className="bg-green-50 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-100">
                  {company._count.stockItems} Items
                </span>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 1. New Voucher */}
              <Link
                href={`/companies/${company.id}/vouchers/create`}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition text-sm shadow-sm"
              >
                <span>📝</span> New Voucher
              </Link>

              {/* 2. Day Book */}
              <Link
                href={`/companies/${company.id}/vouchers`}
                className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded transition text-sm"
              >
                <span>📖</span> Day Book
              </Link>

              {/* 3. Inventory (NEW) */}
              <Link
                href={`/companies/${company.id}/inventory`}
                className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded transition text-sm"
              >
                <span>📦</span> Inventory
              </Link>

              {/* 4. Chart of Accounts */}
              <Link
                href={`/companies/${company.id}/chart-of-accounts`}
                className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded transition text-sm"
              >
                <span>🗂️</span> Accounts
              </Link>
            </div>

            {/* Footer / Edit */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <Link
                href={`/companies/edit/${company.id}`}
                className="text-gray-400 hover:text-gray-800 text-sm font-medium flex items-center gap-1 transition"
              >
                Settings ⚙️
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
