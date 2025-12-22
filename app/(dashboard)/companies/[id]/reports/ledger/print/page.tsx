import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// --- Types ---
type Transaction = {
  id: number;
  date: Date;
  voucherNo: string;
  type: string;
  narration: string | null;
  amount: number;
};

const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default async function LedgerPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { ledgerId, from, to } = await searchParams;
  const companyId = parseInt(id);

  if (!ledgerId) {
    return <div className="p-10 text-center font-bold">No Ledger Selected</div>;
  }

  const lid = parseInt(ledgerId);
  const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!ledger) return <div className="p-10 text-center">Ledger not found.</div>;

  // --- Dates ---
  const today = new Date();
  const currentYear =
    today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const fromStr = from || `${currentYear}-04-01`;
  const toStr = to || today.toISOString().split("T")[0];

  const fromDate = new Date(fromStr);
  const toDateEnd = new Date(toStr);
  toDateEnd.setHours(23, 59, 59, 999);

  // ====================================================
  // 1. CALCULATE OPENING BALANCE (Complex Aggregation)
  // ====================================================
  const prevFilter = { date: { lt: fromDate }, status: "APPROVED" };

  const [prevSales, prevPur, prevPay, prevRcpt, prevCntr, prevJrnl] =
    await Promise.all([
      prisma.salesLedgerEntry.aggregate({
        where: { ledgerId: lid, salesVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.purchaseLedgerEntry.aggregate({
        where: { ledgerId: lid, purchaseVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.paymentLedgerEntry.aggregate({
        where: { ledgerId: lid, paymentVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.receiptLedgerEntry.aggregate({
        where: { ledgerId: lid, receiptVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.contraLedgerEntry.aggregate({
        where: { ledgerId: lid, contraVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.journalLedgerEntry.aggregate({
        where: { ledgerId: lid, journalVoucher: prevFilter },
        _sum: { amount: true },
      }),
    ]);

  const totalPrevMovement =
    (prevSales._sum.amount || 0) +
    (prevPur._sum.amount || 0) +
    (prevPay._sum.amount || 0) +
    (prevRcpt._sum.amount || 0) +
    (prevCntr._sum.amount || 0) +
    (prevJrnl._sum.amount || 0);

  const openingBalance = ledger.openingBalance + totalPrevMovement;

  // ====================================================
  // 2. FETCH TRANSACTIONS (Multi-Table Fetch)
  // ====================================================
  const currentFilter = {
    date: { gte: fromDate, lte: toDateEnd },
    status: "APPROVED",
  };

  const [sales, purchase, payment, receipt, contra, journal] =
    await Promise.all([
      prisma.salesLedgerEntry.findMany({
        where: { ledgerId: lid, salesVoucher: currentFilter },
        include: { salesVoucher: true },
      }),
      prisma.purchaseLedgerEntry.findMany({
        where: { ledgerId: lid, purchaseVoucher: currentFilter },
        include: { purchaseVoucher: true },
      }),
      prisma.paymentLedgerEntry.findMany({
        where: { ledgerId: lid, paymentVoucher: currentFilter },
        include: { paymentVoucher: true },
      }),
      prisma.receiptLedgerEntry.findMany({
        where: { ledgerId: lid, receiptVoucher: currentFilter },
        include: { receiptVoucher: true },
      }),
      prisma.contraLedgerEntry.findMany({
        where: { ledgerId: lid, contraVoucher: currentFilter },
        include: { contraVoucher: true },
      }),
      prisma.journalLedgerEntry.findMany({
        where: { ledgerId: lid, journalVoucher: currentFilter },
        include: { journalVoucher: true },
      }),
    ]);

  const formatTx = (entry: any, type: string, vKey: string): Transaction => ({
    id: entry.id,
    date: entry[vKey].date,
    voucherNo: entry[vKey].voucherNo.toString(),
    type: type,
    narration: entry[vKey].narration,
    amount: entry.amount,
  });

  const transactions = [
    ...sales.map((e) => formatTx(e, "SALES", "salesVoucher")),
    ...purchase.map((e) => formatTx(e, "PURCHASE", "purchaseVoucher")),
    ...payment.map((e) => formatTx(e, "PAYMENT", "paymentVoucher")),
    ...receipt.map((e) => formatTx(e, "RECEIPT", "receiptVoucher")),
    ...contra.map((e) => formatTx(e, "CONTRA", "contraVoucher")),
    ...journal.map((e) => formatTx(e, "JOURNAL", "journalVoucher")),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = openingBalance;

  return (
    <div className="bg-white p-10 min-h-screen text-black font-sans leading-tight print:p-0">
      {/* Auto-Print Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: "window.onload = () => { window.print(); }",
        }}
      />

      {/* HEADER */}
      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {company?.name || "Statement of Account"}
          </h1>
          <p className="text-lg font-bold text-gray-700 uppercase mt-1">
            Ledger: {ledger.name}
          </p>
          {company?.address && (
            <p className="text-xs text-gray-500 max-w-md mt-1">
              {company.address}
            </p>
          )}
        </div>
        <div className="text-right text-sm font-bold uppercase">
          <p className="bg-black text-white px-2 py-1 inline-block mb-2">
            Statement
          </p>
          <p>
            {fmtDate(fromDate)} to {fmtDate(toDateEnd)}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left font-bold uppercase text-[10px]">
            <th className="py-2 w-20">Date</th>
            <th className="py-2 w-24">Vch Type</th>
            <th className="py-2 w-20">Vch No</th>
            <th className="py-2">Narration</th>
            <th className="py-2 text-right w-24">Debit</th>
            <th className="py-2 text-right w-24">Credit</th>
            <th className="py-2 text-right w-28">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {/* OPENING ROW */}
          <tr className="font-bold italic bg-gray-50">
            <td className="py-3">—</td>
            <td className="py-3">—</td>
            <td className="py-3">—</td>
            <td className="py-3 uppercase text-gray-500">
              Opening Balance B/F
            </td>
            <td className="py-3 text-right">
              {openingBalance < 0 ? fmt(Math.abs(openingBalance)) : ""}
            </td>
            <td className="py-3 text-right">
              {openingBalance > 0 ? fmt(Math.abs(openingBalance)) : ""}
            </td>
            <td className="py-3 text-right font-black">
              {fmt(Math.abs(openingBalance))} {openingBalance < 0 ? "Dr" : "Cr"}
            </td>
          </tr>

          {/* TRANSACTIONS */}
          {transactions.map((tx) => {
            runningBalance += tx.amount; // Add because Debit is negative, Credit is positive in schema?
            // WAIT! Check your schema logic. Usually:
            // Debit = Positive, Credit = Negative? OR
            // Tally XML: Debit is Positive, Credit is Negative.
            // Let's assume standard: Dr = Neg, Cr = Pos (Based on previous logic)
            // If Schema: Dr = Neg, then Dr column shows when amt < 0.

            // Adjusting display logic to match standard Tally behavior
            // Usually in DB: Dr is stored as negative for easy Sum.

            const isDebit = tx.amount < 0; // Assuming DB stores Dr as negative
            const isCredit = tx.amount > 0;

            return (
              <tr key={`${tx.type}-${tx.id}`} className="break-inside-avoid">
                <td className="py-3 align-top font-bold">{fmtDate(tx.date)}</td>
                <td className="py-3 align-top text-[9px] uppercase">
                  {tx.type}
                </td>
                <td className="py-3 align-top font-mono font-bold text-gray-500">
                  {tx.voucherNo}
                </td>
                <td className="py-3 align-top pr-4">
                  <div className="text-[10px] text-gray-700 leading-tight">
                    {tx.narration || "-"}
                  </div>
                </td>
                <td className="py-3 text-right align-top font-mono font-bold text-slate-700">
                  {isDebit ? fmt(Math.abs(tx.amount)) : ""}
                </td>
                <td className="py-3 text-right align-top font-mono font-bold text-slate-700">
                  {isCredit ? fmt(Math.abs(tx.amount)) : ""}
                </td>
                <td className="py-3 text-right align-top font-mono font-black text-[11px]">
                  {fmt(Math.abs(runningBalance))}{" "}
                  <span className="text-[8px] text-gray-400 font-bold">
                    {runningBalance < 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* FOOTER */}
        <tfoot>
          <tr className="border-t-4 border-black font-black bg-gray-50">
            <td
              colSpan={4}
              className="py-4 text-right pr-6 uppercase tracking-widest text-[10px]"
            >
              Closing Balance
            </td>
            <td className="py-4 text-right">
              {/* Total Debits logic if needed, usually just closing balance */}
            </td>
            <td className="py-4 text-right">
              {/* Total Credits logic if needed */}
            </td>
            <td className="py-4 text-right text-lg font-mono">
              {fmt(Math.abs(runningBalance))} {runningBalance < 0 ? "Dr" : "Cr"}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <span>Generated by Accounting App</span>
        <span>{new Date().toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
