import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  Landmark,
  ArrowRight,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default async function BRSPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);
  const sp = await searchParams;
  const ledgerId = sp.ledgerId ? parseInt(sp.ledgerId) : null;

  // 1. Fetch only Bank/Cash ledgers for the dropdown
  const bankLedgers = await prisma.ledger.findMany({
    where: {
      companyId,
      group: { name: { contains: "Bank" } },
    },
    orderBy: { name: "asc" },
  });

  let transactions: any[] = [];
  let selectedLedgerName = "";

  if (ledgerId) {
    const selectedLedger = bankLedgers.find((l) => l.id === ledgerId);
    selectedLedgerName = selectedLedger?.name || "";

    // 2. Fetch from all 6 separate tables
    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesLedgerEntry.findMany({
          where: { ledgerId, salesVoucher: { status: "APPROVED" } },
          include: { salesVoucher: true },
        }),
        prisma.purchaseLedgerEntry.findMany({
          where: { ledgerId, purchaseVoucher: { status: "APPROVED" } },
          include: { purchaseVoucher: true },
        }),
        prisma.paymentLedgerEntry.findMany({
          where: { ledgerId, paymentVoucher: { status: "APPROVED" } },
          include: { paymentVoucher: true },
        }),
        prisma.receiptLedgerEntry.findMany({
          where: { ledgerId, receiptVoucher: { status: "APPROVED" } },
          include: { receiptVoucher: true },
        }),
        prisma.contraLedgerEntry.findMany({
          where: { ledgerId, contraVoucher: { status: "APPROVED" } },
          include: { contraVoucher: true },
        }),
        prisma.journalLedgerEntry.findMany({
          where: { ledgerId, journalVoucher: { status: "APPROVED" } },
          include: { journalVoucher: true },
        }),
      ]);

    // 3. Unify the data structure helper
    const formatEntry = (entry: any, type: string, vKey: string) => ({
      id: entry.id,
      date: entry[vKey].date,
      voucherNo: entry[vKey].voucherNo,
      type: type,
      amount: entry.amount,
      narration: entry[vKey].narration,
      bankDate: entry.bankDate || null,
    });

    // 4. Combine and Sort
    transactions = [
      ...sales.map((e: any) => formatEntry(e, "SALES", "salesVoucher")),
      ...purchase.map((e: any) =>
        formatEntry(e, "PURCHASE", "purchaseVoucher")
      ),
      ...payment.map((e: any) => formatEntry(e, "PAYMENT", "paymentVoucher")),
      ...receipt.map((e: any) => formatEntry(e, "RECEIPT", "receiptVoucher")),
      ...contra.map((e: any) => formatEntry(e, "CONTRA", "contraVoucher")),
      ...journal.map((e: any) => formatEntry(e, "JOURNAL", "journalVoucher")),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 pb-20">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-white shadow-lg shadow-slate-900/20">
                <Landmark size={24} />
              </div>
              Bank Reconciliation
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl">
              Reconcile your bank statements with system entries. Enter the
              'Bank Date' for cleared transactions to update the reconciliation
              status.
            </p>
          </div>

          {/* Ledger Selector Card */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <form className="flex items-center gap-2">
              <select
                name="ledgerId"
                defaultValue={ledgerId || ""}
                className="h-10 border-none bg-slate-50 rounded-lg pl-3 pr-8 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 cursor-pointer hover:bg-slate-100 transition-colors appearance-none"
              >
                <option value="" disabled>
                  Select Bank Account...
                </option>
                {bankLedgers.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2">
                Load Data <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Toolbar / Info Bar */}
          {ledgerId && (
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Ledger:
                </span>
                <span className="text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                  {selectedLedgerName}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {transactions.filter((t: any) => t.bankDate).length} Cleared
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {transactions.filter((t: any) => !t.bankDate).length} Pending
                </span>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">
                    Type / No
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Particulars
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">
                    Debit
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">
                    Credit
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-48 bg-slate-50/50 border-l border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarDays size={12} /> Bank Date
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                        <AlertCircle className="text-slate-300" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        No Transactions Found
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        {ledgerId
                          ? "There are no approved transactions for this bank ledger yet."
                          : "Please select a bank account from the dropdown above to start."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => {
                    const isCleared = !!tx.bankDate;
                    return (
                      <tr
                        key={`${tx.type}-${tx.id}`}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {format(new Date(tx.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {tx.type}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              #{tx.voucherNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-xs font-medium text-slate-600 truncate max-w-xs"
                            title={tx.narration}
                          >
                            {tx.narration || (
                              <span className="text-slate-300 italic">
                                No narration
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">
                          {tx.amount < 0 && (
                            <span className="text-rose-600">
                              {Math.abs(tx.amount).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">
                          {tx.amount > 0 && (
                            <span className="text-emerald-600">
                              {Math.abs(tx.amount).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-6 py-4 border-l border-slate-100 text-center transition-colors ${
                            isCleared ? "bg-emerald-50/30" : "bg-slate-50/30"
                          }`}
                        >
                          <div className="relative inline-block w-full max-w-[140px]">
                            <input
                              type="date"
                              className={`w-full text-xs font-bold px-3 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-center
                                                        ${
                                                          isCleared
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                        }`}
                              defaultValue={
                                tx.bankDate
                                  ? format(new Date(tx.bankDate), "yyyy-MM-dd")
                                  : ""
                              }
                            />
                            {isCleared && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                                <CheckCircle2 size={12} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
