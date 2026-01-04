"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Filter,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export default function CashBookClient({ data, companyId, searchParams }: any) {
  const router = useRouter();
  const {
    cashLedgers,
    entries,
    openingBalance,
    closingBalance,
    selectedLedgerId,
  } = data;

  const [ledger, setLedger] = useState(selectedLedgerId);
  const [startDate, setStartDate] = useState(
    searchParams.from ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.to || new Date().toISOString().split("T")[0]
  );

  const handleApply = () => {
    router.push(
      `/companies/${companyId}/reports/cash-book?ledgerId=${ledger}&from=${startDate}&to=${endDate}`
    );
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* --- FILTER BAR --- */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Select Cash Ledger
          </label>
          <select
            value={ledger}
            onChange={(e) => setLedger(e.target.value)}
            className="h-9 text-xs font-bold border border-slate-300 rounded px-2 min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {cashLedgers.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-xs font-bold border border-slate-300 rounded px-2 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-xs font-bold border border-slate-300 rounded px-2 outline-none"
          />
        </div>

        <button
          onClick={handleApply}
          className="h-9 px-4 bg-indigo-600 text-white text-xs font-bold uppercase rounded hover:bg-indigo-700 flex items-center gap-2"
        >
          <Filter size={12} /> Run Report
        </button>

        <button
          onClick={() => window.print()}
          className="h-9 px-4 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase rounded hover:bg-slate-50 flex items-center gap-2 ml-auto"
        >
          <Printer size={12} /> Print
        </button>
      </div>

      {/* --- REPORT HEADER --- */}
      <div className="p-6 pb-2 text-center bg-white">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Cash Book
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1">
          {cashLedgers.find((l: any) => l.id == ledger)?.name} •{" "}
          {format(new Date(startDate), "dd MMM yyyy")} to{" "}
          {format(new Date(endDate), "dd MMM yyyy")}
        </p>
      </div>

      {/* --- TABLE --- */}
      <div className="flex-1 p-6 pt-2 overflow-auto">
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-300">
              <tr>
                <th className="px-4 py-2 w-24">Date</th>
                <th className="px-4 py-2 w-32">Particulars</th>
                <th className="px-4 py-2 w-20">Vch Type</th>
                <th className="px-4 py-2 w-20">Vch No</th>
                <th className="px-4 py-2 w-32 text-right bg-emerald-50/50 text-emerald-700">
                  Receipt (In)
                </th>
                <th className="px-4 py-2 w-32 text-right bg-rose-50/50 text-rose-700">
                  Payment (Out)
                </th>
                <th className="px-4 py-2 w-32 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {/* OPENING BALANCE ROW */}
              <tr className="bg-slate-50 font-bold italic text-slate-600">
                <td className="px-4 py-2" colSpan={4}>
                  Opening Balance
                </td>
                <td className="px-4 py-2 text-right">
                  {openingBalance < 0
                    ? formatCurrency(Math.abs(openingBalance))
                    : ""}
                </td>
                <td className="px-4 py-2 text-right">
                  {openingBalance > 0 ? formatCurrency(openingBalance) : ""}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {formatCurrency(Math.abs(openingBalance))}{" "}
                  {openingBalance < 0 ? "Dr" : "Cr"}
                </td>
              </tr>

              {/* TRANSACTIONS */}
              {entries.map((row: any) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-4 py-2 text-slate-500">
                    {format(new Date(row.date), "dd-MM-yyyy")}
                  </td>
                  <td className="px-4 py-2 font-bold uppercase text-slate-700">
                    {row.particulars}
                  </td>
                  <td className="px-4 py-2 text-[10px] uppercase text-slate-400">
                    {row.type}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-slate-400">
                    #{row.voucherNo}
                  </td>

                  {/* DEBIT (IN) */}
                  <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                    {row.debit > 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        {formatCurrency(row.debit)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* CREDIT (OUT) */}
                  <td className="px-4 py-2 text-right font-mono font-bold text-rose-700 bg-rose-50/10">
                    {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                  </td>

                  {/* RUNNING BALANCE */}
                  <td className="px-4 py-2 text-right font-mono font-black text-slate-900">
                    {formatCurrency(row.balance)}{" "}
                    <span className="text-[9px] text-slate-400">
                      {row.balanceType}
                    </span>
                  </td>
                </tr>
              ))}

              {/* EMPTY STATE */}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-400 italic"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td
                  className="px-4 py-2 text-right uppercase tracking-widest text-slate-500"
                  colSpan={4}
                >
                  Current Total
                </td>
                <td className="px-4 py-2 text-right font-mono text-emerald-700">
                  {formatCurrency(
                    entries.reduce((a: any, b: any) => a + b.debit, 0)
                  )}
                </td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">
                  {formatCurrency(
                    entries.reduce((a: any, b: any) => a + b.credit, 0)
                  )}
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-900 bg-slate-200">
                  {formatCurrency(Math.abs(closingBalance))}{" "}
                  {closingBalance < 0 ? "Dr" : "Cr"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
