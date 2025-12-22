import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

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

  if (ledgerId) {
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

    // 4. Combine and Sort (Added explicit types for Ubuntu Build)
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Bank Reconciliation (BRS)
        </h1>
      </div>

      {/* Ledger Selector */}
      <form className="flex gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Select Bank Account
          </label>
          <select
            name="ledgerId"
            defaultValue={ledgerId || ""}
            className="border rounded-lg p-2 text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose Ledger --</option>
            {bankLedgers.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
          View Transactions
        </button>
      </form>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Vch Type</th>
              <th className="p-4">Vch No</th>
              <th className="p-4">Narration</th>
              <th className="p-4 text-right">Debit</th>
              <th className="p-4 text-right">Credit</th>
              <th className="p-4 text-center">Bank Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-slate-400 italic"
                >
                  {ledgerId
                    ? "No transactions found"
                    : "Select a bank ledger to begin reconciliation"}
                </td>
              </tr>
            ) : (
              transactions.map((tx: any) => (
                <tr
                  key={`${tx.type}-${tx.id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    {format(new Date(tx.date), "dd MMM yyyy")}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-slate-100">
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{tx.voucherNo}</td>
                  <td className="p-4 text-slate-500 truncate max-w-[200px]">
                    {tx.narration || "-"}
                  </td>
                  <td className="p-4 text-right font-mono text-red-600">
                    {tx.amount < 0 ? Math.abs(tx.amount).toFixed(2) : ""}
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-600">
                    {tx.amount > 0 ? Math.abs(tx.amount).toFixed(2) : ""}
                  </td>
                  <td className="p-4 text-center">
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-xs"
                      defaultValue={
                        tx.bankDate
                          ? format(new Date(tx.bankDate), "yyyy-MM-dd")
                          : ""
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
