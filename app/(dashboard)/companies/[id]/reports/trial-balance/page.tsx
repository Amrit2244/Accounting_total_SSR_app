import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle } from "lucide-react";

export default async function TrialBalancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: { select: { name: true } },
      salesEntries: {
        where: { salesVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
      purchaseEntries: {
        where: { purchaseVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
      paymentEntries: {
        where: { paymentVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
      receiptEntries: {
        where: { receiptVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
      contraEntries: {
        where: { contraVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
      journalEntries: {
        where: { journalVoucher: { status: "APPROVED" } },
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const groupMap: Record<
    string,
    { name: string; debit: number; credit: number }
  > = {};
  let totalDebit = 0;
  let totalCredit = 0;

  ledgers.forEach((l: any) => {
    // ✅ FIXED: Added explicit types to sum function and reduce parameters
    const sum = (arr: any[]) =>
      arr.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    const closing = l.openingBalance + txTotal;
    if (closing === 0) return;

    const groupName = l.group?.name || "Ungrouped";
    if (!groupMap[groupName]) {
      groupMap[groupName] = { name: groupName, debit: 0, credit: 0 };
    }

    if (closing > 0) {
      groupMap[groupName].debit += closing;
      totalDebit += closing;
    } else {
      groupMap[groupName].credit += Math.abs(closing);
      totalCredit += Math.abs(closing);
    }
  });

  const trialData = Object.values(groupMap).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const fmt = (val: number) =>
    val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const difference = Math.abs(totalDebit - totalCredit);
  const isMismatch = difference > 0.01;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Trial Balance
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Group Summary
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      {isMismatch && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />{" "}
            <span className="text-sm font-bold">Trial Balance Mismatch!</span>
          </div>
          <div className="text-sm font-mono font-bold">
            Difference: ₹{fmt(difference)}
          </div>
        </div>
      )}

      <div
        className={`bg-white border rounded-xl shadow-lg overflow-hidden ${
          isMismatch ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"
        }`}
      >
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center p-3">
          <div className="flex-1">Particulars</div>
          <div className="w-40 text-right">Debit (₹)</div>
          <div className="w-40 text-right">Credit (₹)</div>
        </div>
        <div className="divide-y divide-slate-100">
          {trialData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs uppercase font-bold">
              No data available
            </div>
          ) : (
            trialData.map((group: any) => (
              <div
                key={group.name}
                className="flex items-center p-3 hover:bg-slate-50 transition-colors text-sm"
              >
                <div className="flex-1 font-bold text-slate-700">
                  {group.name}
                </div>
                <div className="w-40 text-right font-mono font-medium text-slate-600">
                  {group.debit > 0 ? fmt(group.debit) : ""}
                </div>
                <div className="w-40 text-right font-mono font-medium text-slate-600">
                  {group.credit > 0 ? fmt(group.credit) : ""}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-slate-100 border-t border-slate-200 flex items-center p-3 text-xs font-black uppercase">
          <div className="flex-1 text-right pr-4 text-slate-500">
            Grand Total
          </div>
          <div
            className={`w-40 text-right font-mono border-t-2 pt-1 ${
              isMismatch
                ? "text-red-600 border-red-300"
                : "text-slate-900 border-slate-300"
            }`}
          >
            {fmt(totalDebit)}
          </div>
          <div
            className={`w-40 text-right font-mono border-t-2 pt-1 ${
              isMismatch
                ? "text-red-600 border-red-300"
                : "text-slate-900 border-slate-300"
            }`}
          >
            {fmt(totalCredit)}
          </div>
        </div>
      </div>
    </div>
  );
}
