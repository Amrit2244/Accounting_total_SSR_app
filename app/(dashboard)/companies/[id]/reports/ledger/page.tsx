import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import ReportActionButtons from "@/components/ReportActionButtons";
import LedgerSearchFilter from "@/components/LedgerSearchFilter";

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

  const today = new Date();
  const currentYear =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const defaultFrom = from || `${currentYear}-04-01`;
  const defaultTo = to || today.toISOString().split("T")[0];

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
      // ✅ FIX 1: OPENING BALANCE - APPROVED ONLY
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

      // ✅ FIX 2: CURRENT ENTRIES - APPROVED ONLY
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

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  let runningBalance = openingBalance;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            <FileText size={24} /> LEDGER STATEMENT
          </h1>
        </div>
        <div className="flex gap-3">
          <ReportActionButtons />
          <Link
            href={`/companies/${companyId}`}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {/* FILTER */}
      <LedgerSearchFilter
        ledgers={ledgers}
        defaultLedgerId={ledgerId}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
      />

      {/* REPORT */}
      {reportData ? (
        <div id="printable-area" className="bg-white">
          <div className="mb-6 text-center border-b pb-4">
            <h2 className="text-2xl font-bold uppercase text-slate-900">
              {reportData.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Statement Period:{" "}
              <span className="font-bold">
                {new Date(defaultFrom).toLocaleDateString()}
              </span>{" "}
              to{" "}
              <span className="font-bold">
                {new Date(defaultTo).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 border border-slate-200 rounded print:bg-transparent print:border-black">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Opening Balance
              </p>
              <p className="text-lg font-mono font-bold text-slate-700">
                {fmt(Math.abs(openingBalance))}{" "}
                {openingBalance >= 0 ? "Dr" : "Cr"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Current Closing Balance
              </p>
              <p className="text-xl font-mono font-black text-[#003366] print:text-black">
                {fmt(Math.abs(closingBalance))}{" "}
                {closingBalance >= 0 ? "Dr" : "Cr"}
              </p>
            </div>
          </div>

          <table className="w-full text-sm text-left border border-slate-300 print:border-black">
            <thead className="bg-[#003366] text-white text-xs uppercase font-bold print:bg-transparent print:text-black print:border-b-2 print:border-black">
              <tr>
                {/* ✅ NEW COLUMN HEADER */}
                <th className="p-2 border-r border-slate-500 print:border-black">
                  Trans ID
                </th>
                <th className="p-2 border-r border-slate-500 print:border-black">
                  Date
                </th>
                <th className="p-2 border-r border-slate-500 print:border-black">
                  Particulars
                </th>
                <th className="p-2 border-r border-slate-500 print:border-black">
                  Vch Type
                </th>
                <th className="p-2 border-r border-slate-500 print:border-black text-right">
                  Debit
                </th>
                <th className="p-2 border-r border-slate-500 print:border-black text-right">
                  Credit
                </th>
                <th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 print:divide-black">
              {/* OPENING BALANCE ROW */}
              <tr className="bg-yellow-50 font-bold print:bg-transparent">
                {/* ✅ Updated colSpan from 3 to 4 to cover new column */}
                <td className="p-2 border-r print:border-black" colSpan={4}>
                  Opening Balance
                </td>
                <td className="p-2 text-right border-r print:border-black font-mono">
                  {openingBalance > 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="p-2 text-right border-r print:border-black font-mono">
                  {openingBalance < 0 ? fmt(Math.abs(openingBalance)) : ""}
                </td>
                <td className="p-2 text-right font-mono">
                  {fmt(Math.abs(openingBalance))}{" "}
                  {openingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>

              {entries.map((entry) => {
                runningBalance += entry.amount;
                return (
                  <tr
                    key={entry.id}
                    className="print:border-b print:border-gray-300"
                  >
                    {/* ✅ NEW COLUMN DATA */}
                    <td className="p-2 border-r border-gray-200 print:border-black font-mono font-bold text-gray-500 text-xs">
                      {entry.voucher.transactionCode}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black whitespace-nowrap">
                      {entry.voucher.date.toLocaleDateString()}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black font-medium">
                      {entry.voucher.narration || "As per details"}
                    </td>
                    <td className="p-2 border-r border-gray-200 print:border-black text-xs uppercase">
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
                      {runningBalance >= 0 ? "Dr" : "Cr"}
                    </td>
                  </tr>
                );
              })}

              {entries.length === 0 && (
                <tr>
                  {/* ✅ Updated colSpan from 6 to 7 */}
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-400 italic"
                  >
                    No approved transactions found.
                  </td>
                </tr>
              )}

              {/* CLOSING TOTAL ROW */}
              <tr className="bg-[#e6f0ff] font-bold border-t-2 border-[#003366] print:bg-transparent print:border-black">
                {/* ✅ Updated colSpan from 3 to 4 */}
                <td className="p-2 text-right" colSpan={4}>
                  Totals / Closing
                </td>
                <td className="p-2 text-right border-r border-blue-200 print:border-black font-mono">
                  {fmt(
                    (openingBalance > 0 ? openingBalance : 0) + periodTotalDr
                  )}
                </td>
                <td className="p-2 text-right border-r border-blue-200 print:border-black font-mono">
                  {fmt(
                    (openingBalance < 0 ? Math.abs(openingBalance) : 0) +
                      periodTotalCr
                  )}
                </td>
                <td className="p-2 text-right font-mono text-lg">
                  {fmt(Math.abs(closingBalance))}{" "}
                  {closingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="hidden print:block mt-8 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
            Generated by Accounting App on {new Date().toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold">No Account Selected</p>
        </div>
      )}
    </div>
  );
}
