import { getDashboardMetrics } from "@/app/actions/dashboard";
import DashboardCharts from "@/components/DashboardCharts";
import Link from "next/link";
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  Clock,
  Landmark,
  Package,
  Book,
} from "lucide-react";

export default async function CompanyDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) return <div>Invalid Company ID</div>;

  const { cards, chart, recents } = await getDashboardMetrics(companyId);

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">
            Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Financial Overview for FY {new Date().getFullYear()}
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers/create`}
          className="bg-[#003366] text-white px-5 py-2 rounded shadow hover:bg-blue-900 font-bold text-sm"
        >
          + Quick Entry
        </Link>
      </div>

      {/* 2. QUICK LINKS ROW (NEW) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Banking BRS Link */}
        <Link
          href={`/companies/${companyId}/banking/brs`}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md flex items-center gap-4 transition-all group"
        >
          <div className="bg-purple-100 p-3 rounded-full text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-700">Banking / BRS</h3>
            <p className="text-xs text-gray-500">Reconcile Bank Statements</p>
          </div>
        </Link>

        {/* Ledgers Master */}
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md flex items-center gap-4 transition-all group"
        >
          <div className="bg-blue-100 p-3 rounded-full text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Book size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-700">Ledger Master</h3>
            <p className="text-xs text-gray-500">Edit / Delete Accounts</p>
          </div>
        </Link>

        {/* Inventory Master */}
        <Link
          href={`/companies/${companyId}/inventory`}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md flex items-center gap-4 transition-all group"
        >
          <div className="bg-orange-100 p-3 rounded-full text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-700">Stock Items</h3>
            <p className="text-xs text-gray-500">Manage Products & Prices</p>
          </div>
        </Link>
      </div>

      {/* 3. METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-lg flex flex-col justify-between h-32 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Cash In Hand
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                ₹ {cards.totalCash.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-full">
              <Wallet size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-lg flex flex-col justify-between h-32 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Bank Balance
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                ₹ {cards.totalBank.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
              <Building2 size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-lg flex flex-col justify-between h-32 border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Receivables
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                ₹ {cards.totalDebtors.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-full">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-lg flex flex-col justify-between h-32 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Payables
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                ₹ {cards.totalCreditors.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-full">
              <TrendingDown size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS */}
      <DashboardCharts data={chart} />

      {/* 5. RECENT ACTIVITY */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-[#003366] text-sm uppercase">
            Recent Transactions
          </h3>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recents.map((v) => (
            <div
              key={v.id}
              className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-full ${
                    v.type === "SALES"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {v.type === "SALES" ? (
                    <TrendingUp size={16} />
                  ) : (
                    <Wallet size={16} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {v.type} #{v.voucherNo}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {v.date.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-slate-800">
                  ₹{" "}
                  {v.entries
                    .reduce(
                      (acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0),
                      0
                    )
                    .toFixed(2)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {v.status === "APPROVED" ? (
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                      <CheckCircle size={10} /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
                      <Clock size={10} /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {recents.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No recent transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
