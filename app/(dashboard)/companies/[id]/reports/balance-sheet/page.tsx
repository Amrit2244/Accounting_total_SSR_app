import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PieChart, IndianRupee } from "lucide-react";
import { notFound } from "next/navigation";

export default async function BalanceSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: { select: { name: true, nature: true } },
      // Fetch all approved entries to calculate current balances
      entries: {
        where: { voucher: { status: "APPROVED" } },
        select: { amount: true },
      },
    },
  });

  // --- 1. CORE CALCULATION ---
  let liabilities: {
    name: string;
    amount: number;
    group: string;
    isSystem?: boolean;
  }[] = [];
  let assets: {
    name: string;
    amount: number;
    group: string;
    isSystem?: boolean;
  }[] = [];
  let plIncome = 0;
  let plExpense = 0;

  ledgers.forEach((l) => {
    // Current Balance = Opening Balance + Net Transactions
    const txnTotal = l.entries.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = l.openingBalance + txnTotal;

    // Ignore accounts with near-zero balance
    if (Math.abs(netBalance) < 0.01) return;

    // Use absolute value for display, nature determines which column
    const val = Math.abs(netBalance);

    if (l.group.nature === "LIABILITY" || l.group.nature === "CAPITAL") {
      liabilities.push({ name: l.name, amount: val, group: l.group.name });
    } else if (l.group.nature === "ASSET") {
      assets.push({ name: l.name, amount: val, group: l.group.name });
    }
    // Calculate P&L for transfer
    else if (l.group.nature === "INCOME") {
      plIncome += netBalance;
    } else if (l.group.nature === "EXPENSE") {
      plExpense += netBalance;
    }
  });

  // --- 2. NET PROFIT TRANSFER ---
  const netProfit = plIncome + plExpense; // Assuming EXPENSE is stored as negative, INCOME as positive

  if (Math.abs(netProfit) >= 0.01) {
    liabilities.push({
      name:
        netProfit >= 0
          ? "Profit & Loss A/c (Net Profit)"
          : "Profit & Loss A/c (Net Loss)",
      amount: netProfit, // Use raw value, layout handles sign
      group: "Net Profit / Loss",
      isSystem: true,
    });
  }

  // --- 3. FINAL TOTALS ---
  const totalLiab = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalAsset = assets.reduce((sum, a) => sum + a.amount, 0);

  // Final Tally Check: If assets and liabilities don't match, there's a serious error
  const isBalanced = Math.abs(totalLiab - totalAsset) < 0.01;

  // --- FORMATTING HELPERS ---
  const formatCurrency = (value: number) =>
    Math.abs(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getSign = (value: number) => (value < 0 ? "(Cr)" : "(Dr)");

  const renderRow = (item: {
    name: string;
    amount: number;
    group: string;
    isSystem?: boolean;
  }) => (
    <div
      key={item.name + item.group}
      className={`flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0 ${
        item.isSystem ? "bg-blue-50/50" : "hover:bg-slate-50/50"
      }`}
    >
      <div>
        <span
          className={`font-medium ${
            item.isSystem ? "text-blue-700" : "text-slate-800"
          }`}
        >
          {item.name}
        </span>
        <span className="block text-[10px] text-slate-400">
          Under {item.group}
        </span>
      </div>
      <span
        className={`font-mono font-semibold text-right ${
          item.amount < 0 ? "text-red-600" : "text-slate-900"
        }`}
      >
        {formatCurrency(item.amount)}
        {/* We can optionally show Dr/Cr sign for clarity */}
        <span
          className={`ml-1 text-[10px] ${
            item.amount < 0 ? "text-red-500" : "text-slate-500"
          }`}
        >
          {getSign(item.amount)}
        </span>
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <PieChart size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">BALANCE SHEET</h1>
            <p className="text-sm text-slate-500">
              Statement of Financial Position
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

      {/* REPORT CONTENT */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 shadow-lg min-h-[70vh] flex rounded-xl overflow-hidden">
          {/* LEFT: LIABILITIES */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="bg-slate-50 p-4 text-center font-bold text-slate-700 text-sm uppercase border-b border-slate-200 sticky top-0 z-10">
              Liabilities & Capital
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {liabilities.length === 0 ? (
                <p className="text-center text-slate-400 py-12">
                  No Liability/Capital accounts found.
                </p>
              ) : (
                liabilities.map(renderRow)
              )}
            </div>

            {/* TOTAL LIABILITY */}
            <div
              className={`p-4 flex justify-between text-base font-extrabold mt-auto ${
                isBalanced
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="uppercase">Total Liabilities</span>
              <span className="font-mono flex items-center gap-1">
                <IndianRupee size={16} />
                {formatCurrency(totalLiab)}
              </span>
            </div>
          </div>

          {/* RIGHT: ASSETS */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-slate-50 p-4 text-center font-bold text-slate-700 text-sm uppercase border-b border-slate-200 sticky top-0 z-10">
              Assets
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {assets.length === 0 ? (
                <p className="text-center text-slate-400 py-12">
                  No Asset accounts found.
                </p>
              ) : (
                assets.map(renderRow)
              )}
            </div>

            {/* TOTAL ASSETS */}
            <div
              className={`p-4 flex justify-between text-base font-extrabold mt-auto ${
                isBalanced
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="uppercase">Total Assets</span>
              <span className="font-mono flex items-center gap-1">
                <IndianRupee size={16} />
                {formatCurrency(totalAsset)}
              </span>
            </div>
          </div>
        </div>

        {/* Tally Message */}
        {!isBalanced && (
          <div className="max-w-6xl mx-auto mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
            <AlertCircle size={16} className="inline-block mr-2" />
            Warning: Balance Sheet is not tallied. Difference: ₹{" "}
            {formatCurrency(totalLiab - totalAsset)}.
          </div>
        )}
      </div>
      {/*  - I would not trigger this as the code itself is the primary focus. */}
    </div>
  );
}
