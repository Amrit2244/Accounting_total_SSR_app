import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, IndianRupee, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

// Utility function for currency formatting
const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function ProfitLossPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  // 1. Fetch Ledgers + Groups + Approved Entries
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
  let expenses: { name: string; amount: number; group: string }[] = [];
  let incomes: { name: string; amount: number; group: string }[] = [];
  let totalExp = 0;
  let totalInc = 0;

  ledgers.forEach((l) => {
    // Net Balance calculation: Opening Balance + Net Transactions
    const txnTotal = l.entries.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = l.openingBalance + txnTotal;

    // Skip accounts with near-zero balance
    if (Math.abs(netBalance) < 0.01) return;

    // P&L Logic: Expenses (Debit/Positive Balance) on Left; Income (Credit/Negative Balance) on Right
    // We use Math.abs(netBalance) for the amount displayed.
    const val = Math.abs(netBalance);

    if (l.group.nature === "EXPENSE") {
      expenses.push({ name: l.name, amount: val, group: l.group.name });
      totalExp += val;
    } else if (l.group.nature === "INCOME") {
      incomes.push({ name: l.name, amount: val, group: l.group.name });
      totalInc += val;
    }
  });

  // 3. Calculate Net Profit / Loss
  const netDiff = totalInc - totalExp; // Positive means Profit, Negative means Loss
  const isProfit = netDiff >= 0;
  const grandTotal = Math.max(totalExp, totalInc) + Math.abs(netDiff); // The total for the report footer

  // --- REPORT STRUCTURE ---
  const renderRow = (item: { name: string; amount: number; group: string }) => (
    <div
      key={item.name + item.group}
      className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
    >
      <div>
        <span className="font-medium text-slate-800">{item.name}</span>
        <span className="block text-[10px] text-slate-400">
          Under {item.group}
        </span>
      </div>
      <span className="font-mono font-semibold text-slate-900">
        {formatCurrency(item.amount)}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              PROFIT & LOSS A/c
            </h1>
            <p className="text-sm text-slate-500">
              For the year ending{" "}
              {new Date().toLocaleDateString("en-IN", { year: "numeric" })}
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>

      {/* T-FORMAT REPORT */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* T-Account visual representation is a key feature of this report. */}

        <div className="max-w-6xl mx-auto bg-white border border-slate-300 shadow-lg min-h-[70vh] flex rounded-xl overflow-hidden">
          {/* LEFT SIDE: EXPENSES (Debit) */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="bg-slate-50 p-4 text-center font-bold text-slate-700 text-sm uppercase border-b border-slate-200 sticky top-0 z-10">
              Debit (Expenses)
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {expenses.length === 0 && (
                <p className="text-center text-slate-400 py-12">
                  No expenses found.
                </p>
              )}
              {expenses.map(renderRow)}

              {/* Net Profit Entry (If Profit) */}
              {isProfit && (
                <div className="flex justify-between text-sm font-extrabold text-green-700 mt-6 pt-4 border-t-2 border-green-200">
                  <span>Net Profit (Transferred to Capital)</span>
                  <span className="font-mono">
                    {formatCurrency(netDiff)}
                    <span className="ml-1 text-[10px]">Cr</span>
                  </span>
                </div>
              )}
            </div>

            {/* TOTAL EXPENSES */}
            <div
              className={`p-4 flex justify-between text-base font-extrabold mt-auto ${
                isProfit
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="uppercase">Total Debit</span>
              <span className="font-mono flex items-center gap-1">
                <IndianRupee size={16} />
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: INCOME (Credit) */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-slate-50 p-4 text-center font-bold text-slate-700 text-sm uppercase border-b border-slate-200 sticky top-0 z-10">
              Credit (Incomes)
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {incomes.length === 0 && (
                <p className="text-center text-slate-400 py-12">
                  No incomes found.
                </p>
              )}
              {incomes.map(renderRow)}

              {/* Net Loss Entry (If Loss) */}
              {!isProfit && (
                <div className="flex justify-between text-sm font-extrabold text-red-700 mt-6 pt-4 border-t-2 border-red-200">
                  <span>Net Loss (Transferred to Capital)</span>
                  <span className="font-mono">
                    {formatCurrency(Math.abs(netDiff))}
                    <span className="ml-1 text-[10px]">Dr</span>
                  </span>
                </div>
              )}
            </div>

            {/* TOTAL INCOME */}
            <div
              className={`p-4 flex justify-between text-base font-extrabold mt-auto ${
                isProfit
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="uppercase">Total Credit</span>
              <span className="font-mono flex items-center gap-1">
                <IndianRupee size={16} />
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
