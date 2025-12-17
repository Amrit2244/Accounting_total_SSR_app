import { prisma } from "@/lib/prisma";
import { createLedger } from "@/app/actions/account";
import Link from "next/link";
import { ArrowLeft, Check, BookOpen, Layers } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Groups to populate the dropdown
  // We include 'nature' to show helpful context (Asset, Liability, etc.)
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* 1. Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link
            href={`/companies/${companyId}/chart-of-accounts`}
            className="hover:text-blue-600 transition-colors"
          >
            Chart of Accounts
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">New Ledger</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Create New Ledger
        </h1>
        <p className="text-slate-500 mt-1">
          Add a new account head (e.g. Bank Account, Sales, Vendor) to your
          books.
        </p>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <form action={createLedger} className="p-6 md:p-8 space-y-6">
          <input type="hidden" name="companyId" value={companyId} />

          {/* Ledger Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. HDFC Bank, Office Rent, ABC Traders"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Group Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Under Group <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Layers
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <select
                name="groupId"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled selected>
                  Select an Account Group...
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} &mdash; ({g.nature})
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Correct grouping ensures accurate financial reports (Balance Sheet
              / P&L).
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Opening Balance Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Opening Balance (₹)
              </label>
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                defaultValue="0"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-mono text-right focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Dr / Cr
              </label>
              <select
                name="balanceType"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="Dr">Dr (Debit) - Assets/Expenses</option>
                <option value="Cr">Cr (Credit) - Liabilities/Income</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={`/companies/${companyId}/chart-of-accounts`}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Cancel
            </Link>
            <button className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
              <Check size={18} /> Save Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
