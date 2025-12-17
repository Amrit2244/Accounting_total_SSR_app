import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
// Assuming ReportActionButtons handles print/export
import ReportActionButtons from "@/components/ReportActionButtons";
// Assuming the polished controls component is here:
import LedgerSearchFilter from "@/components/LedgerSearchFilter";

// Helper component for currency formatting (reuse logic from Report Page)
const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

// Helper for date formatting
const fmtDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default async function LedgerReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { ledgerId, from, to } = await searchParams;
  const companyId = parseInt(id);

  // Default Dates
  const today = new Date();
  const currentYear =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const defaultFrom = from || `${currentYear}-04-01`;
  const defaultTo = to || today.toISOString().split("T")[0];

  // Fetch all ledgers for the filter dropdown
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let reportData = null;
  let openingBalance = 0;
  let closingBalance = 0;
  let periodTotalDr = 0;
  let periodTotalCr = 0;
  let entries: any[] = [];

  if (ledgerId) {
    const lid = parseInt(ledgerId);
    const fromISO = new Date(`${defaultFrom}T00:00:00.000Z`);
    const toISO = new Date(`${defaultTo}T23:59:59.999Z`);

    const ledger = await prisma.ledger.findUnique({ where: { id: lid } });

    if (ledger) {
      // 1. Calculate Opening Balance (Ledger's initial balance + approved transactions BEFORE 'from' date)
      const prevEntries = await prisma.voucherEntry.findMany({
        where: {
          ledgerId: lid,
          voucher: {
            date: { lt: fromISO },
            status: "APPROVED",
          },
        },
      });
      const prevDr = prevEntries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      const prevCr = prevEntries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      openingBalance = (ledger.openingBalance || 0) + (prevDr - prevCr);

      // 2. Fetch Current Entries (Approved transactions WITHIN the date range)
      entries = await prisma.voucherEntry.findMany({
        where: {
          ledgerId: lid,
          voucher: {
            date: { gte: fromISO, lte: toISO },
            status: "APPROVED",
          },
        },
        include: { voucher: true },
        orderBy: { voucher: { date: "asc" } },
      });

      // 3. Totals
      periodTotalDr = entries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      periodTotalCr = entries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      closingBalance = openingBalance + (periodTotalDr - periodTotalCr);

      reportData = ledger;
    }
  }

  // Running balance starts at opening balance
  let runningBalance = openingBalance;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen">
      {/* HEADER & CONTROLS (Non-Printable) */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4 no-print">
        <div className="flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            LEDGER STATEMENT
          </h1>
        </div>
        <ReportActionButtons />
      </div>

      {/* FILTER CONTROLS */}
      <LedgerSearchFilter
        companyId={companyId}
        ledgers={ledgers}
        defaultLedgerId={ledgerId}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
      />

      {/* REPORT AREA */}
      {reportData ? (
        <div
          id="printable-area"
          className="bg-white p-6 rounded-xl shadow-lg print:p-0 print:shadow-none"
        >
          {/* Report Title & Period */}
          <div className="mb-6 text-center border-b border-slate-200 pb-4 print:border-black">
            <h2 className="text-2xl font-bold uppercase text-slate-900 print:text-black">
              {reportData.name}
            </h2>
            <p className="text-sm text-slate-500 mt-1 print:text-black">
              Statement Period:{" "}
              <span className="font-bold">
                {fmtDate(new Date(defaultFrom))}
              </span>{" "}
              to{" "}
              <span className="font-bold">{fmtDate(new Date(defaultTo))}</span>
            </p>
          </div>

          {/* Balance Summary Card */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50/50 p-4 border border-blue-200 rounded-lg print:hidden">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase">
                Opening Balance
              </p>
              <p className="text-lg font-mono font-bold text-slate-900 flex items-center gap-1 mt-1">
                <IndianRupee size={16} />
                {fmt(Math.abs(openingBalance))}{" "}
                <span className="text-sm text-slate-600">
                  {openingBalance >= 0 ? "Dr" : "Cr"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-600 uppercase">
                Closing Balance
              </p>
              <p className="text-xl font-mono font-black text-blue-800 flex items-center justify-end gap-1 mt-1">
                <IndianRupee size={18} />
                {fmt(Math.abs(closingBalance))}{" "}
                <span className="text-base">
                  {closingBalance >= 0 ? "Dr" : "Cr"}
                </span>
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <table className="w-full text-sm text-left border border-slate-300 print:border-black">
            <thead className="bg-slate-800 text-white text-xs uppercase font-bold print:bg-slate-200 print:text-black print:border-b-2 print:border-black">
              <tr>
                <th className="p-3 border-r border-slate-700 print:border-black">
                  Trans ID
                </th>
                <th className="p-3 border-r border-slate-700 print:border-black">
                  Date
                </th>
                <th className="p-3 border-r border-slate-700 print:border-black">
                  Particulars
                </th>
                <th className="p-3 border-r border-slate-700 print:border-black">
                  Vch Type
                </th>
                <th className="p-3 border-r border-slate-700 print:border-black text-right">
                  Debit (₹)
                </th>
                <th className="p-3 border-r border-slate-700 print:border-black text-right">
                  Credit (₹)
                </th>
                <th className="p-3 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 print:divide-black">
              {/* OPENING BALANCE ROW */}
              <tr className="bg-slate-50 font-semibold print:bg-slate-100">
                <td
                  className="p-2 border-r print:border-black text-slate-500"
                  colSpan={4}
                >
                  Opening Balance
                </td>
                <td className="p-2 text-right border-r print:border-black font-mono">
                  {openingBalance > 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="p-2 text-right border-r print:border-black font-mono">
                  {openingBalance < 0 ? fmt(Math.abs(openingBalance)) : ""}
                </td>
                <td className="p-2 text-right font-mono font-bold text-blue-700 print:text-black">
                  {fmt(Math.abs(openingBalance))}{" "}
                  {openingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>

              {/* TRANSACTION ROWS */}
              {entries.map((entry) => {
                runningBalance += entry.amount;
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 print:border-b print:border-gray-300"
                  >
                    <td className="p-2 border-r border-gray-200 print:border-black font-mono font-bold text-gray-500 text-xs">
                      {entry.voucher.transactionCode}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black whitespace-nowrap text-xs">
                      {fmtDate(entry.voucher.date)}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black font-medium text-sm">
                      {entry.voucher.narration || "As per details"}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black text-xs uppercase text-slate-600">
                      {entry.voucher.type} #{entry.voucher.voucherNo}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black text-right font-mono text-slate-700 print:text-black">
                      {entry.amount > 0 ? fmt(entry.amount) : ""}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black text-right font-mono text-slate-700 print:text-black">
                      {entry.amount < 0 ? fmt(Math.abs(entry.amount)) : ""}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 print:text-black">
                      {fmt(Math.abs(runningBalance))}{" "}
                      <span className="text-xs">
                        {runningBalance >= 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-400 italic"
                  >
                    No approved transactions found within the selected period.
                  </td>
                </tr>
              )}

              {/* CLOSING TOTAL ROW */}
              <tr className="bg-blue-100 font-extrabold border-t-2 border-blue-600 print:bg-slate-200 print:border-black">
                <td className="p-3 text-right text-slate-800" colSpan={4}>
                  Period Totals / Closing Balance
                </td>
                <td className="p-3 text-right border-r border-blue-200 print:border-black font-mono text-slate-800">
                  {fmt(
                    (openingBalance > 0 ? openingBalance : 0) + periodTotalDr
                  )}
                </td>
                <td className="p-3 text-right border-r border-blue-200 print:border-black font-mono text-slate-800">
                  {fmt(
                    (openingBalance < 0 ? Math.abs(openingBalance) : 0) +
                      periodTotalCr
                  )}
                </td>
                <td className="p-3 text-right font-mono text-lg text-blue-800 print:text-black">
                  {fmt(Math.abs(closingBalance))}{" "}
                  {closingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            Generated by Accounting App on{" "}
            {new Date().toLocaleDateString("en-IN")}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold text-lg text-slate-600">
            Select an Account to View Ledger
          </p>
          <p className="text-sm">
            Choose an account from the dropdown above to generate the statement.
          </p>
        </div>
      )}
    </div>
  );
}
