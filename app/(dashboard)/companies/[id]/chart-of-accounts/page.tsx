import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Plus, FilePlus2 } from "lucide-react";

export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    include: {
      ledgers: {
        include: {
          entries: { where: { voucher: { status: "APPROVED" } } },
        },
      },
      children: {
        include: {
          ledgers: {
            include: {
              entries: { where: { voucher: { status: "APPROVED" } } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const rootGroups = groups.filter((g) => g.parentId === null);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* 1. HEADER SECTION (Button is here) */}
      <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0 sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Building2 size={18} /> GENERAL LEDGER
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-wider">
            Chart of Accounts & Balances
          </p>
        </div>

        <div className="flex gap-3">
          {/* ✅ THE CREATE BUTTON */}
          <Link
            href={`/companies/${companyId}/chart-of-accounts/create`}
            className="text-xs font-bold bg-yellow-500 text-[#002244] hover:bg-yellow-400 px-5 py-2 rounded shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus size={16} strokeWidth={3} /> NEW LEDGER
          </Link>

          <Link
            href={`/`}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={12} /> BACK
          </Link>
        </div>
      </div>

      {/* 2. MAIN LIST CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto bg-white border border-gray-300 shadow-sm min-h-[600px]">
          {/* Empty State Check */}
          {rootGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FilePlus2 size={48} className="mb-4 text-gray-300" />
              <p>No accounts found.</p>
              <Link
                href={`/companies/${companyId}/chart-of-accounts/create`}
                className="text-blue-600 font-bold mt-2 hover:underline"
              >
                Create your first Ledger
              </Link>
            </div>
          )}

          {/* Table Header */}
          {rootGroups.length > 0 && (
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[11px] font-bold text-[#003366] uppercase py-2 px-4 sticky top-0 z-10">
              <div className="col-span-8">Particulars</div>
              <div className="col-span-4 text-right">Closing Balance (INR)</div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {rootGroups.map((group) => (
              <div key={group.id}>
                <div className="bg-slate-50 py-2 px-4 flex justify-between items-center border-b border-gray-200">
                  <span className="font-bold text-sm text-slate-800 uppercase">
                    {group.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-white border border-gray-200 px-1.5 rounded">
                    {group.nature}
                  </span>
                </div>

                {/* Ledgers */}
                {group.ledgers.map((l) => {
                  const dr = l.entries
                    .filter((e) => e.amount > 0)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const cr = l.entries
                    .filter((e) => e.amount < 0)
                    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                  const net = l.openingBalance + (dr - cr);

                  return (
                    <div
                      key={l.id}
                      className="grid grid-cols-12 py-2 px-8 hover:bg-yellow-50 transition-colors text-xs border-b border-gray-100"
                    >
                      <div className="col-span-8 font-medium text-slate-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        {l.name}
                      </div>
                      <div className="col-span-4 text-right font-mono font-bold text-slate-900">
                        {Math.abs(net).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {net >= 0 ? "Dr" : "Cr"}
                      </div>
                    </div>
                  );
                })}

                {/* Sub-Groups (Children) */}
                {group.children.map((child) => (
                  <div key={child.id}>
                    <div className="py-1.5 px-8 font-bold text-slate-600 text-xs italic bg-slate-50/50 border-b border-gray-100">
                      ↳ {child.name}
                    </div>
                    {child.ledgers.map((l) => {
                      const dr = l.entries
                        .filter((e) => e.amount > 0)
                        .reduce((sum, e) => sum + e.amount, 0);
                      const cr = l.entries
                        .filter((e) => e.amount < 0)
                        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                      const net = l.openingBalance + (dr - cr);
                      return (
                        <div
                          key={l.id}
                          className="grid grid-cols-12 py-2 px-12 hover:bg-yellow-50 transition-colors text-xs border-b border-gray-100"
                        >
                          <div className="col-span-8 text-slate-600 flex items-center gap-2">
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            {l.name}
                          </div>
                          <div className="col-span-4 text-right font-mono text-slate-700">
                            {Math.abs(net).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            {net >= 0 ? "Dr" : "Cr"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
