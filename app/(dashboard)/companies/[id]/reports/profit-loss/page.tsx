import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default async function ProfitLossPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch Ledgers + Groups
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: { select: { name: true, nature: true } },
      entries: {
        where: { voucher: { status: "APPROVED" } },
        select: { amount: true },
      },
    },
  });

  // 2. Classify Data
  let expenses: any[] = [];
  let incomes: any[] = [];
  let totalExp = 0;
  let totalInc = 0;

  ledgers.forEach((l) => {
    // Net Balance calculation
    const txnTotal = l.entries.reduce((sum, e) => sum + e.amount, 0);
    const net = l.openingBalance + txnTotal;
    if (Math.abs(net) < 0.01) return; // Skip zero balance

    // Tally Logic:
    // Expenses (Debit Balance) -> Left Side
    // Incomes (Credit Balance) -> Right Side
    if (l.group.nature === "EXPENSE") {
      const val = Math.abs(net); // Expenses are debit (positive in our DB logic usually, but let's be safe)
      expenses.push({ name: l.name, amount: val, group: l.group.name });
      totalExp += val;
    } else if (l.group.nature === "INCOME") {
      const val = Math.abs(net); // Incomes are credit (negative in DB)
      incomes.push({ name: l.name, amount: val, group: l.group.name });
      totalInc += val;
    }
  });

  // 3. Calculate Net Profit / Loss
  const netDiff = totalInc - totalExp;
  const isProfit = netDiff >= 0;

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] bg-slate-100">
      {/* HEADER */}
      <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} /> PROFIT & LOSS A/c
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-wider">
            For the year ending {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/reports`}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-1"
          >
            <ArrowLeft size={12} /> BACK
          </Link>
        </div>
      </div>

      {/* T-FORMAT REPORT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto bg-white border border-gray-300 shadow-sm min-h-[600px] flex">
          {/* LEFT SIDE: EXPENSES */}
          <div className="w-1/2 border-r border-gray-300 flex flex-col">
            <div className="bg-gray-100 p-2 text-center font-bold text-[#003366] text-xs uppercase border-b border-gray-300">
              Particulars (Expenses)
            </div>
            <div className="flex-1 p-4 space-y-2">
              {expenses.map((e, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs border-b border-dashed border-gray-200 pb-1"
                >
                  <div>
                    <span className="font-bold text-slate-800">{e.name}</span>
                    <span className="block text-[10px] text-gray-400">
                      {e.group}
                    </span>
                  </div>
                  <span className="font-mono">
                    {e.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}

              {/* Net Profit goes here if Profit */}
              {isProfit && (
                <div className="flex justify-between text-xs font-bold text-green-700 mt-6 pt-2 border-t border-gray-300">
                  <span>NET PROFIT</span>
                  <span>
                    {netDiff.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-[#003366] text-white p-2 flex justify-between text-sm font-bold mt-auto">
              <span>Total</span>
              <span>
                {Math.max(totalExp, totalInc).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: INCOME */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-100 p-2 text-center font-bold text-[#003366] text-xs uppercase border-b border-gray-300">
              Particulars (Income)
            </div>
            <div className="flex-1 p-4 space-y-2">
              {incomes.map((inc, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs border-b border-dashed border-gray-200 pb-1"
                >
                  <div>
                    <span className="font-bold text-slate-800">{inc.name}</span>
                    <span className="block text-[10px] text-gray-400">
                      {inc.group}
                    </span>
                  </div>
                  <span className="font-mono">
                    {inc.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}

              {/* Net Loss goes here if Loss */}
              {!isProfit && (
                <div className="flex justify-between text-xs font-bold text-red-600 mt-6 pt-2 border-t border-gray-300">
                  <span>NET LOSS</span>
                  <span>
                    {Math.abs(netDiff).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-[#003366] text-white p-2 flex justify-between text-sm font-bold mt-auto">
              <span>Total</span>
              <span>
                {Math.max(totalExp, totalInc).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
