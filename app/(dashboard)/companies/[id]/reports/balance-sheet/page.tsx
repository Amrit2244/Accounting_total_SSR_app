import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PieChart } from "lucide-react";

export default async function BalanceSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

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

  let liabilities: any[] = [];
  let assets: any[] = [];
  let totalLiab = 0;
  let totalAsset = 0;

  // Variables for P&L Calculation (to bring Net Profit into BS)
  let plIncome = 0;
  let plExpense = 0;

  ledgers.forEach((l) => {
    const txnTotal = l.entries.reduce((sum, e) => sum + e.amount, 0);
    const net = l.openingBalance + txnTotal;
    if (Math.abs(net) < 0.01) return;

    const val = Math.abs(net);

    if (l.group.nature === "LIABILITY") {
      liabilities.push({ name: l.name, amount: val, group: l.group.name });
      totalLiab += val;
    } else if (l.group.nature === "ASSET") {
      assets.push({ name: l.name, amount: val, group: l.group.name });
      totalAsset += val;
    }
    // Calculate P&L in background to find Net Profit
    else if (l.group.nature === "INCOME") {
      plIncome += val;
    } else if (l.group.nature === "EXPENSE") {
      plExpense += val;
    }
  });

  // Calculate Net Profit
  const netProfit = plIncome - plExpense;

  // Add Net Profit to Liabilities (or deduct loss)
  // In accounting, Profit increases Capital (Liability side)
  if (netProfit !== 0) {
    liabilities.push({
      name:
        netProfit >= 0
          ? "Profit & Loss A/c (Profit)"
          : "Profit & Loss A/c (Loss)",
      amount: netProfit, // Use raw value, layout handles negative display if needed
      group: "Reserves & Surplus",
      isSystem: true,
    });
    totalLiab += netProfit;
  }

  // Final Tally Check
  // Note: If DB entries are correct double-entry, totalLiab should equal totalAsset exactly.
  // Due to our positive/negative storage logic:
  // Assets are usually Debit (+), Liabilities Credit (-).
  // totalLiab logic above summed absolute values.

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] bg-slate-100">
      {/* HEADER */}
      <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <PieChart size={18} /> BALANCE SHEET
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-wider">
            Statement of Financial Position
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

      {/* REPORT CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto bg-white border border-gray-300 shadow-sm min-h-[600px] flex">
          {/* LEFT: LIABILITIES */}
          <div className="w-1/2 border-r border-gray-300 flex flex-col">
            <div className="bg-gray-100 p-2 text-center font-bold text-[#003366] text-xs uppercase border-b border-gray-300">
              Liabilities
            </div>
            <div className="flex-1 p-4 space-y-2">
              {liabilities.map((l, i) => (
                <div
                  key={i}
                  className={`flex justify-between text-xs border-b border-dashed border-gray-200 pb-1 ${
                    l.isSystem ? "text-blue-700 font-bold" : ""
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-800">{l.name}</span>
                    <span className="block text-[10px] text-gray-400">
                      {l.group}
                    </span>
                  </div>
                  <span className="font-mono">
                    {l.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#003366] text-white p-2 flex justify-between text-sm font-bold mt-auto">
              <span>Total</span>
              <span>
                {totalLiab.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* RIGHT: ASSETS */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-100 p-2 text-center font-bold text-[#003366] text-xs uppercase border-b border-gray-300">
              Assets
            </div>
            <div className="flex-1 p-4 space-y-2">
              {assets.map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs border-b border-dashed border-gray-200 pb-1"
                >
                  <div>
                    <span className="font-bold text-slate-800">{a.name}</span>
                    <span className="block text-[10px] text-gray-400">
                      {a.group}
                    </span>
                  </div>
                  <span className="font-mono">
                    {a.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#003366] text-white p-2 flex justify-between text-sm font-bold mt-auto">
              <span>Total</span>
              <span>
                {totalAsset.toLocaleString("en-IN", {
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
