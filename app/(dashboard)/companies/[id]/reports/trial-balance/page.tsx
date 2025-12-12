import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default async function TrialBalancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch all Ledgers with their Approved Entries
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: { select: { name: true } },
      entries: {
        where: { voucher: { status: "APPROVED" } }, // ONLY Verified Vouchers
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Calculate Net Balances
  let totalDr = 0;
  let totalCr = 0;

  const reportData = ledgers
    .map((ledger) => {
      // Sum of transactions
      const txnTotal = ledger.entries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );

      // Net Balance = Opening + Transactions
      // (Positive = Debit, Negative = Credit)
      const netBalance = ledger.openingBalance + txnTotal;

      if (netBalance > 0) totalDr += netBalance;
      if (netBalance < 0) totalCr += Math.abs(netBalance);

      return {
        id: ledger.id,
        name: ledger.name,
        groupName: ledger.group.name,
        balance: netBalance,
      };
    })
    .filter((l) => Math.abs(l.balance) > 0.01); // Hide zero balance accounts

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] bg-slate-100">
      {/* 1. REPORT HEADER */}
      <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Scale size={18} /> TRIAL BALANCE
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-wider">
            Consolidated view of all ledger balances
          </p>
        </div>
        <div className="flex gap-3">
          <button className="text-xs font-bold bg-[#004b8d] hover:bg-blue-800 px-3 py-1.5 rounded transition-colors">
            PRINT / PDF
          </button>
          <Link
            href={`/companies/${companyId}/reports`}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={12} /> BACK
          </Link>
        </div>
      </div>

      {/* 2. REPORT CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto bg-white border border-gray-300 shadow-sm min-h-[600px] flex flex-col">
          {/* Table Headers */}
          <div className="grid grid-cols-12 bg-gray-100 border-b-2 border-gray-300 text-[11px] font-bold text-[#003366] uppercase py-3 px-4 sticky top-0">
            <div className="col-span-6">Particulars</div>
            <div className="col-span-3 text-right">Debit Balance</div>
            <div className="col-span-3 text-right">Credit Balance</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 flex-1">
            {reportData.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 py-2 px-4 hover:bg-blue-50 transition-colors text-xs text-slate-700"
              >
                {/* Name & Group */}
                <div className="col-span-6">
                  <div className="font-bold text-slate-900">{row.name}</div>
                  <div className="text-[10px] text-slate-500 italic">
                    {row.groupName}
                  </div>
                </div>

                {/* Debit Column */}
                <div className="col-span-3 text-right font-mono font-medium">
                  {row.balance > 0
                    ? row.balance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })
                    : ""}
                </div>

                {/* Credit Column */}
                <div className="col-span-3 text-right font-mono font-medium">
                  {row.balance < 0
                    ? Math.abs(row.balance).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })
                    : ""}
                </div>
              </div>
            ))}

            {reportData.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic">
                No balances found. Record transactions to generate report.
              </div>
            )}
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-12 bg-[#003366] text-white py-3 px-4 border-t-2 border-[#002244] text-sm font-bold sticky bottom-0">
            <div className="col-span-6 text-right pr-4 uppercase">
              Grand Total:
            </div>
            <div className="col-span-3 text-right font-mono text-yellow-300">
              {totalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="col-span-3 text-right font-mono text-yellow-300">
              {totalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Diff Checker (If totals don't match) */}
          {Math.abs(totalDr - totalCr) > 0.01 && (
            <div className="bg-red-100 text-red-700 text-center text-xs font-bold py-1 border-t border-red-200">
              DIFFERENCE IN BOOKS: {Math.abs(totalDr - totalCr).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
