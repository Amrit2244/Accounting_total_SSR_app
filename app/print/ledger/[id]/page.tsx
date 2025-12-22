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

// --- Formatters ---
const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (date: Date) => format(date, "dd MMM yyyy");

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
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 font-medium uppercase tracking-widest">
        No Ledger Selected
      </div>
    );
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
  // 1. OPENING BALANCE CALCULATION
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
  // 2. FETCH TRANSACTIONS
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

  // --- Calculate Totals ---
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  transactions.forEach((t) => {
    if (t.amount < 0) totalDebit += Math.abs(t.amount);
    else totalCredit += t.amount;
  });

  return (
    <div className="bg-white text-slate-900 font-sans text-sm min-h-screen p-8 print:p-0">
      {/* Auto Print */}
      <script
        dangerouslySetInnerHTML={{
          __html: "window.onload = () => { window.print(); }",
        }}
      />

      {/* --- HEADER --- */}
      <div className="mb-8 border-b border-slate-900 pb-6 flex justify-between items-start">
        <div className="flex gap-4">
          {/* Stylish Logo Placeholder */}
          <div className="h-14 w-14 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-2xl shadow-lg print:shadow-none">
            {company?.name.substring(0, 1) || "C"}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
              {company?.name || "Company Name"}
            </h1>
            <p className="text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
              {company?.address || "Address Line 1, City, State - Zip Code"}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              GSTIN: {company?.gstin || "N/A"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-light text-slate-200 uppercase tracking-widest leading-none">
            Statement
          </h2>
          <div className="mt-2 text-right">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Statement Period
            </span>
            <span className="block font-bold text-slate-800">
              {fmtDate(fromDate)} <span className="text-slate-400 mx-1">—</span>{" "}
              {fmtDate(toDateEnd)}
            </span>
          </div>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100 print:bg-transparent print:border-slate-300">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Account Name
            </span>
            <span className="text-2xl font-black text-slate-900">
              {ledger.name}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Net Balance
            </span>
            <span className="text-xl font-bold font-mono">
              {fmt(Math.abs(openingBalance + totalCredit - totalDebit))}
              <span
                className={`ml-1 ${
                  openingBalance + totalCredit - totalDebit < 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {openingBalance + totalCredit - totalDebit < 0 ? "DR" : "CR"}
              </span>
            </span>
          </div>
        </div>

        {/* 4-Grid Summary */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Opening Bal
            </span>
            <span className="block font-mono font-bold text-slate-700 mt-1">
              {fmt(Math.abs(openingBalance))} {openingBalance < 0 ? "Dr" : "Cr"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Debit
            </span>
            <span className="block font-mono font-bold text-red-600 mt-1">
              {fmt(totalDebit)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Credit
            </span>
            <span className="block font-mono font-bold text-emerald-600 mt-1">
              {fmt(totalCredit)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Closing Bal
            </span>
            <span className="block font-mono font-bold text-slate-900 mt-1 bg-slate-200 px-2 rounded w-fit print:bg-transparent print:p-0">
              {fmt(Math.abs(openingBalance + totalCredit - totalDebit))}
              {openingBalance + totalCredit - totalDebit < 0 ? " Dr" : " Cr"}
            </span>
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-900 text-left">
            <th className="py-3 pl-2 font-bold text-slate-900 uppercase tracking-wider w-24">
              Date
            </th>
            <th className="py-3 font-bold text-slate-900 uppercase tracking-wider w-24">
              Vch Type
            </th>
            <th className="py-3 font-bold text-slate-900 uppercase tracking-wider w-24">
              Vch No
            </th>
            <th className="py-3 font-bold text-slate-900 uppercase tracking-wider">
              Particulars / Narration
            </th>
            <th className="py-3 text-right font-bold text-slate-900 uppercase tracking-wider w-28">
              Debit
            </th>
            <th className="py-3 text-right font-bold text-slate-900 uppercase tracking-wider w-28">
              Credit
            </th>
            <th className="py-3 pr-2 text-right font-bold text-slate-900 uppercase tracking-wider w-32">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {/* Opening Row */}
          <tr className="bg-slate-50/50 print:bg-transparent">
            <td className="py-3 pl-2 font-medium text-slate-400">—</td>
            <td className="py-3 font-medium text-slate-400">—</td>
            <td className="py-3 font-medium text-slate-400">—</td>
            <td className="py-3 font-bold text-slate-600 uppercase tracking-wide italic">
              Opening Balance B/F
            </td>
            <td className="py-3 text-right font-mono text-slate-500">
              {openingBalance < 0 ? fmt(Math.abs(openingBalance)) : ""}
            </td>
            <td className="py-3 text-right font-mono text-slate-500">
              {openingBalance > 0 ? fmt(Math.abs(openingBalance)) : ""}
            </td>
            <td className="py-3 pr-2 text-right font-mono font-bold text-slate-800">
              {fmt(Math.abs(openingBalance))} {openingBalance < 0 ? "Dr" : "Cr"}
            </td>
          </tr>

          {/* Transactions */}
          {transactions.map((tx) => {
            runningBalance += tx.amount;
            const isDebit = tx.amount < 0;
            const isCredit = tx.amount > 0;

            return (
              <tr
                key={tx.id}
                className="break-inside-avoid hover:bg-slate-50 transition-colors print:hover:bg-transparent"
              >
                <td className="py-3 pl-2 align-top font-bold text-slate-700">
                  {fmtDate(tx.date)}
                </td>
                <td className="py-3 align-top font-bold text-[10px] uppercase text-slate-500 tracking-wider pt-3.5">
                  {tx.type}
                </td>
                <td className="py-3 align-top font-mono text-slate-500 pt-3">
                  {tx.voucherNo}
                </td>
                <td className="py-3 align-top pr-6">
                  <div className="text-slate-800 font-medium leading-relaxed">
                    {tx.narration || "Transaction Entry"}
                  </div>
                </td>
                <td className="py-3 align-top text-right font-mono font-medium text-red-700">
                  {isDebit ? fmt(Math.abs(tx.amount)) : ""}
                </td>
                <td className="py-3 align-top text-right font-mono font-medium text-emerald-700">
                  {isCredit ? fmt(Math.abs(tx.amount)) : ""}
                </td>
                <td className="py-3 pr-2 align-top text-right font-mono font-bold text-slate-900 bg-slate-50/30 print:bg-transparent">
                  {fmt(Math.abs(runningBalance))}{" "}
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    {runningBalance < 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Footer Totals */}
        <tfoot>
          <tr className="border-t-2 border-slate-900 font-bold bg-slate-50 print:bg-transparent">
            <td
              colSpan={4}
              className="py-4 pl-2 text-right uppercase text-[10px] tracking-widest text-slate-500 pr-6"
            >
              Total Period Movement
            </td>
            <td className="py-4 text-right font-mono text-red-700 text-sm border-b-4 border-double border-slate-300">
              {fmt(totalDebit)}
            </td>
            <td className="py-4 text-right font-mono text-emerald-700 text-sm border-b-4 border-double border-slate-300">
              {fmt(totalCredit)}
            </td>
            <td className="py-4 pr-2 text-right font-mono text-slate-900 text-sm bg-slate-100 print:bg-transparent border-b-4 border-double border-slate-900">
              {fmt(Math.abs(runningBalance))} {runningBalance < 0 ? "Dr" : "Cr"}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* --- FOOTER --- */}
      <div className="mt-16 flex justify-between items-end border-t border-slate-200 pt-6">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <p>Generated by Accounting System</p>
          <p className="mt-1">{new Date().toLocaleString()}</p>
        </div>
        <div className="text-center">
          <div className="h-12 border-b border-slate-300 w-40 mb-2"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Authorized Signatory
          </p>
        </div>
      </div>
    </div>
  );
}
