import { prisma } from "@/lib/prisma";
import { createLedger } from "@/app/actions/account"; // We will create this next
import Link from "next/link";
import { ArrowLeft, Save, Building2 } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Groups to populate the dropdown
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {/* Form Card */}
      <div className="bg-white border-t-4 border-t-[#003366] border border-gray-300 shadow-lg rounded-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-[#003366] flex items-center gap-2">
            <Building2 size={24} /> CREATE NEW LEDGER
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new account head to your General Ledger.
          </p>
        </div>

        {/* Form */}
        <form action={createLedger} className="p-8 space-y-6">
          <input type="hidden" name="companyId" value={companyId} />

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. SBI Bank Account"
              className="w-full border border-gray-300 p-3 rounded font-bold text-slate-800 focus:border-[#003366] outline-none transition-colors"
            />
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Under Group <span className="text-red-500">*</span>
            </label>
            <select
              name="groupId"
              required
              className="w-full border border-gray-300 p-3 rounded font-medium text-slate-800 focus:border-[#003366] outline-none bg-white"
            >
              <option value="">-- Select Account Group --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.nature})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Select "Bank Accounts" for banks, "Direct Income" for sales, etc.
            </p>
          </div>

          {/* Opening Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Opening Balance
              </label>
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                defaultValue="0"
                className="w-full border border-gray-300 p-3 rounded font-mono font-bold text-right focus:border-[#003366] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Dr / Cr
              </label>
              <select
                name="balanceType"
                className="w-full border border-gray-300 p-3 rounded font-bold text-slate-700 bg-white"
              >
                <option value="Dr">Dr (Debit)</option>
                <option value="Cr">Cr (Credit)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-4">
            <Link
              href={`/companies/${companyId}/chart-of-accounts`}
              className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Cancel
            </Link>
            <button className="bg-[#003366] hover:bg-blue-900 text-white px-8 py-3 rounded font-bold shadow-md flex items-center gap-2 transition-all">
              <Save size={18} /> SAVE LEDGER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
