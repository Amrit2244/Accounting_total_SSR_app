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
    const sum = (arr: any[]) =>
      arr.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const txTotal =
      sum(l.salesEntries) +
      sum(l.purchaseEntries) +
      sum(l.paymentEntries) +
      sum(l.receiptEntries) +
      sum(l.contraEntries) +
      sum(l.journalEntries);

    // Standard Math: Balance = Opening + Sum of Transactions
    const closing = (l.openingBalance || 0) + txTotal;

    if (Math.abs(closing) < 0.01) return; // Skip zero balances

    const groupName = l.group?.name || "Ungrouped";
    if (!groupMap[groupName]) {
      groupMap[groupName] = { name: groupName, debit: 0, credit: 0 };
    }

    /**
     * ✅ LOGIC FIX:
     * Tally/Import Standard: Negative (< 0) is Debit (Dr)
     * Tally/Import Standard: Positive (> 0) is Credit (Cr)
     */
    if (closing < 0) {
      const val = Math.abs(closing);
      groupMap[groupName].debit += val;
      totalDebit += val;
    } else {
      const val = closing;
      groupMap[groupName].credit += val;
      totalCredit += val;
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

  // A Trial Balance should ideally result in totalDebit === totalCredit
  const difference = Math.abs(totalDebit - totalCredit);
  const isMismatch = difference > 0.1; // Tolerance for floating point

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 font-sans px-4">
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
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            <span className="text-sm font-bold">Trial Balance Mismatch!</span>
          </div>
          <div className="text-sm font-mono font-bold">
            Difference: ₹{fmt(difference)}
          </div>
        </div>
      )}

      <div
        className={`bg-white border rounded-xl shadow-lg overflow-hidden ${
          isMismatch ? "border-rose-300" : "border-slate-200"
        }`}
      >
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center p-4">
          <div className="flex-1 text-left pl-2">Group Particulars</div>
          <div className="w-44 text-right pr-4 border-l border-slate-700">
            Debit (₹)
          </div>
          <div className="w-44 text-right pr-2 border-l border-slate-700">
            Credit (₹)
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {trialData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs uppercase font-bold">
              No ledger balances found for this company
            </div>
          ) : (
            trialData.map((group: any) => (
              <div
                key={group.name}
                className="flex items-center p-3.5 hover:bg-slate-50 transition-colors text-sm"
              >
                <div className="flex-1 font-bold text-slate-700 uppercase tracking-tight pl-2">
                  {group.name}
                </div>
                <div className="w-44 text-right font-mono font-bold text-rose-700 pr-4">
                  {group.debit > 0 ? fmt(group.debit) : ""}
                </div>
                <div className="w-44 text-right font-mono font-bold text-emerald-700 pr-2">
                  {group.credit > 0 ? fmt(group.credit) : ""}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 flex items-center p-4 text-xs font-black uppercase">
          <div className="flex-1 text-right pr-6 text-slate-500 tracking-wider">
            Grand Total
          </div>
          <div
            className={`w-44 text-right font-mono text-sm border-t-2 pt-1 pr-4 ${
              isMismatch
                ? "text-rose-600 border-rose-300"
                : "text-slate-900 border-slate-900"
            }`}
          >
            {fmt(totalDebit)}
          </div>
          <div
            className={`w-44 text-right font-mono text-sm border-t-2 pt-1 pr-2 ${
              isMismatch
                ? "text-rose-600 border-rose-300"
                : "text-slate-900 border-slate-900"
            }`}
          >
            {fmt(totalCredit)}
          </div>
        </div>
      </div>
    </div>
  );
}
