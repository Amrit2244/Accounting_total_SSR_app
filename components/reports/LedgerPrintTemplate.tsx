"use client";

import { useState, useEffect } from "react";
import { Printer, Settings } from "lucide-react";

// --- Helper Functions ---
const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function LedgerPrintTemplate({
  company,
  ledger,
  transactions,
  openingBalance,
  fromDate,
  toDate,
}: any) {
  // --- State for Toggles ---
  const [showCompanyHeader, setShowCompanyHeader] = useState(true);
  const [runningBalance, setRunningBalance] = useState(openingBalance);

  // Auto-print removed so user can set options first
  // useEffect(() => { window.print(); }, []);

  let currentBalance = openingBalance;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-black">
      {/* --- NO-PRINT TOOLBAR --- */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg print:hidden sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg hidden sm:block">Print Preview</h2>

          {/* Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700">
            <input
              type="checkbox"
              checked={showCompanyHeader}
              onChange={(e) => setShowCompanyHeader(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium">Show Company Header</span>
          </label>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/50"
        >
          <Printer size={18} />
          Print Now
        </button>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div
        id="print-content"
        className="bg-white max-w-[210mm] mx-auto min-h-screen p-10 shadow-xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0"
      >
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            /* Hide the toolbar specifically */
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>

        {/* HEADER */}
        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
          <div>
            {/* Conditional Rendering based on State */}
            {showCompanyHeader ? (
              <>
                <h1 className="text-3xl font-black uppercase tracking-tighter">
                  {company?.name || "Statement of Account"}
                </h1>
                {company?.address && (
                  <p className="text-xs text-gray-500 max-w-md mt-1">
                    {company.address}
                  </p>
                )}
              </>
            ) : (
              <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-400">
                Statement of Account
              </h1>
            )}

            <p className="text-lg font-bold text-gray-700 uppercase mt-2">
              Ledger: {ledger.name}
            </p>
          </div>

          <div className="text-right text-sm font-bold uppercase">
            <p className="bg-black text-white px-2 py-1 inline-block mb-2">
              Statement
            </p>
            <p>
              {fmtDate(fromDate)} to {fmtDate(toDate)}
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
            {/* OPENING BALANCE ROW */}
            <tr className="font-bold italic bg-gray-50 break-inside-avoid">
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
                {fmt(Math.abs(openingBalance))}{" "}
                {openingBalance < 0 ? "Dr" : "Cr"}
              </td>
            </tr>

            {/* TRANSACTIONS */}
            {transactions.map((tx: any) => {
              currentBalance += tx.amount;
              const isDebit = tx.amount < 0;
              const isCredit = tx.amount > 0;

              return (
                <tr
                  key={`${tx.type}-${tx.id}`}
                  className="break-inside-avoid hover:bg-gray-50"
                >
                  <td className="py-3 align-top font-bold">
                    {fmtDate(tx.date)}
                  </td>
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
                    {fmt(Math.abs(currentBalance))}{" "}
                    <span className="text-[8px] text-gray-400 font-bold">
                      {currentBalance < 0 ? "Dr" : "Cr"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* CLOSING BALANCE FOOTER */}
          <tfoot>
            <tr className="border-t-4 border-black font-black bg-gray-50 break-inside-avoid">
              <td
                colSpan={4}
                className="py-4 text-right pr-6 uppercase tracking-widest text-[10px]"
              >
                Closing Balance
              </td>
              <td className="py-4 text-right"></td>
              <td className="py-4 text-right"></td>
              <td className="py-4 text-right text-lg font-mono">
                {fmt(Math.abs(currentBalance))}{" "}
                {currentBalance < 0 ? "Dr" : "Cr"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
