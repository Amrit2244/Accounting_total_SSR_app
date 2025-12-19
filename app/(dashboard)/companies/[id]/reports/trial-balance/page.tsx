import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle } from "lucide-react";
import ReportPrintBtn from "@/components/reports/ReportPrintBtn"; // ✅ Import the client component

const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
        where: { voucher: { status: "APPROVED" } },
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Calculate Net Balances
  let totalDr = 0;
  let totalCr = 0;
  let openingDiff = 0;

  const reportData = ledgers
    .map((ledger) => {
      const txnTotal = ledger.entries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );
      const netBalance = (ledger.openingBalance || 0) + txnTotal;

      openingDiff += ledger.openingBalance || 0;

      if (netBalance > 0) totalDr += netBalance;
      if (netBalance < 0) totalCr += Math.abs(netBalance);

      return {
        id: ledger.id,
        name: ledger.name,
        groupName: ledger.group.name,
        balance: netBalance,
      };
    })
    .filter((l) => Math.abs(l.balance) > 0.01);

  const diff = totalDr - totalCr;
  const isBalanced = Math.abs(diff) < 0.01;

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-64px)] print:h-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-900 rounded text-white shadow-sm">
            <Scale size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Trial Balance
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Consolidated Ledger Balances
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ REPLACED: Using Client Component here */}
          <ReportPrintBtn />

          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1 print:shadow-none print:border-none">
        <div className="grid grid-cols-12 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.1em] py-2 px-4 sticky top-0 z-10 print:bg-slate-200 print:text-black">
          <div className="col-span-6 flex items-center">Ledger Account</div>
          <div className="col-span-3 text-right border-l border-white/10 px-2">
            Debit (Dr)
          </div>
          <div className="col-span-3 text-right border-l border-white/10 px-2">
            Credit (Cr)
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible">
          {reportData.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
              No ledger balances found.
            </div>
          ) : (
            reportData.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 text-[11px] py-1.5 px-4 border-b border-slate-50 hover:bg-blue-50/50 transition-colors items-center group break-inside-avoid"
              >
                <div className="col-span-6 flex flex-col">
                  <span className="font-bold text-slate-700 uppercase tracking-tighter truncate">
                    {row.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                    Under {row.groupName}
                  </span>
                </div>
                <div className="col-span-3 text-right px-2 font-mono font-bold text-slate-900">
                  {row.balance > 0 ? fmt(row.balance) : "—"}
                </div>
                <div className="col-span-3 text-right px-2 font-mono font-bold text-slate-900">
                  {row.balance < 0 ? fmt(Math.abs(row.balance)) : "—"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTALS */}
        <div
          className={`grid grid-cols-12 py-3 px-4 border-t-2 mt-auto shadow-lg print:border-black ${
            isBalanced
              ? "bg-emerald-600 text-white border-slate-900 print:bg-white print:text-black"
              : "bg-rose-600 text-white border-rose-900"
          }`}
        >
          <div className="col-span-6 text-right pr-6 text-[11px] font-black uppercase tracking-widest flex items-center justify-end gap-2">
            Grand Total
          </div>
          <div className="col-span-3 text-right font-mono text-sm font-black border-l border-white/20 px-2">
            {fmt(totalDr)}
          </div>
          <div className="col-span-3 text-right font-mono text-sm font-black border-l border-white/20 px-2">
            {fmt(totalCr)}
          </div>
        </div>
      </div>

      {/* ERROR DIAGNOSTICS */}
      {!isBalanced && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-3 print:hidden">
          <AlertTriangle className="text-rose-600 shrink-0" size={18} />
          <div>
            <p className="text-xs font-black text-rose-700 uppercase">
              Trial Balance Mismatch of ₹ {fmt(Math.abs(diff))}
            </p>
            <p className="text-[10px] text-rose-600 mt-1">
              Possible Cause:
              {Math.abs(openingDiff) > 0.01
                ? ` Your manual Opening Balances do not match. (Diff: ${fmt(
                    Math.abs(openingDiff)
                  )}). Check your Ledger Masters.`
                : " Data corruption or non-double-entry record found."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
