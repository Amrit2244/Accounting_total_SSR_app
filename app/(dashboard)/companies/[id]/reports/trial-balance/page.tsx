import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default async function TrialBalancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  /** * ✅ AUTO-VERIFY COMPATIBILITY:
   * Only sum up vouchers with APPROVED status.
   * This includes standard checker-approved AND admin auto-approved vouchers.
   */
  const voucherFilter = { status: "APPROVED" };

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: { select: { name: true } },
      salesEntries: {
        where: { salesVoucher: voucherFilter },
        select: { amount: true },
      },
      purchaseEntries: {
        where: { purchaseVoucher: voucherFilter },
        select: { amount: true },
      },
      paymentEntries: {
        where: { paymentVoucher: voucherFilter },
        select: { amount: true },
      },
      receiptEntries: {
        where: { receiptVoucher: voucherFilter },
        select: { amount: true },
      },
      contraEntries: {
        where: { contraVoucher: voucherFilter },
        select: { amount: true },
      },
      journalEntries: {
        where: { journalVoucher: voucherFilter },
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

    const closing = (l.openingBalance || 0) + txTotal;

    if (Math.abs(closing) < 0.01) return;

    const groupName = l.group?.name || "Ungrouped";
    if (!groupMap[groupName]) {
      groupMap[groupName] = { name: groupName, debit: 0, credit: 0 };
    }

    // Tally Logic: Negative is Debit, Positive is Credit
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

  const difference = Math.abs(totalDebit - totalCredit);
  const isMismatch = difference > 0.1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 font-sans px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-xl text-white shadow-lg">
            <Scale size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Reports</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Trial Balance
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black uppercase text-emerald-700">
              Verified Ledger Data
            </span>
          </div>
          <Link
            href={`/companies/${companyId}/reports`}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2.5 rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {isMismatch && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-rose-600" />
            <span className="text-sm font-black uppercase tracking-tight">
              Trial Balance Out of Sync
            </span>
          </div>
          <div className="text-sm font-mono font-black bg-rose-100 px-3 py-1 rounded-md">
            Diff: ₹{fmt(difference)}
          </div>
        </div>
      )}

      <div
        className={`bg-white border-2 rounded-2xl shadow-xl overflow-hidden ${
          isMismatch ? "border-rose-200" : "border-slate-900"
        }`}
      >
        {/* TABLE HEADER */}
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center p-4">
          <div className="flex-1 text-left pl-4">Account Group Particulars</div>
          <div className="w-44 text-right pr-6 border-l border-slate-700">
            Debit (Dr)
          </div>
          <div className="w-44 text-right pr-4 border-l border-slate-700">
            Credit (Cr)
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="divide-y divide-slate-100">
          {trialData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Scale size={40} className="text-slate-200" />
              <span className="text-xs uppercase font-black text-slate-400">
                No active ledger balances
              </span>
            </div>
          ) : (
            trialData.map((group: any) => (
              <div
                key={group.name}
                className="flex items-center p-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 font-bold text-slate-700 uppercase tracking-tight pl-4 group-hover:text-indigo-600 transition-colors">
                  {group.name}
                </div>
                <div className="w-44 text-right font-mono font-bold text-rose-700 pr-6 bg-rose-50/10">
                  {group.debit > 0 ? fmt(group.debit) : ""}
                </div>
                <div className="w-44 text-right font-mono font-bold text-emerald-700 pr-4 bg-emerald-50/10">
                  {group.credit > 0 ? fmt(group.credit) : ""}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER TOTALS */}
        <div className="bg-slate-900 border-t border-slate-800 flex items-center p-5 text-xs font-black uppercase text-white sticky bottom-0">
          <div className="flex-1 text-right pr-8 text-slate-400 tracking-widest">
            Grand Total
          </div>
          <div
            className={`w-44 text-right font-mono text-base pr-6 border-l border-slate-700 ${
              isMismatch ? "text-rose-400" : "text-white"
            }`}
          >
            {fmt(totalDebit)}
          </div>
          <div
            className={`w-44 text-right font-mono text-base pr-4 border-l border-slate-700 ${
              isMismatch ? "text-rose-400" : "text-white"
            }`}
          >
            {fmt(totalCredit)}
          </div>
        </div>
      </div>
    </div>
  );
}
