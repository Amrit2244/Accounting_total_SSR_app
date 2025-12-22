"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Search, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// --- Types ---
type Transaction = {
  id: number;
  date: string; // serialized ISO string
  voucherNo: string;
  type: string;
  narration: string | null;
  amount: number;
  balance: number;
};

type Ledger = {
  id: number;
  name: string;
};

type Props = {
  companyId: number;
  ledgers: Ledger[];
  transactions: Transaction[];
  openingBalance: number;
  closingBalance: number;
  selectedLedgerId: number | null;
  fromDate: string;
  toDate: string;
};

export default function LedgerReportClient({
  companyId,
  ledgers,
  transactions,
  openingBalance,
  closingBalance,
  selectedLedgerId,
  fromDate,
  toDate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Filter State ---
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Local state for dates to allow typing without instant reload
  const [start, setStart] = useState(fromDate);
  const [end, setEnd] = useState(toDate);

  // Sync state if URL changes (e.g. back button)
  useEffect(() => {
    setStart(fromDate);
    setEnd(toDate);
  }, [fromDate, toDate]);

  // --- Smart Search Logic ---
  const filteredLedgers =
    query === ""
      ? ledgers
      : ledgers.filter((l) =>
          l.name.toLowerCase().includes(query.toLowerCase())
        );

  const selectedLedger = ledgers.find((l) => l.id === selectedLedgerId);

  // --- Update URL Trigger ---
  const handleUpdate = (lid: number | null, s: string, e: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lid) params.set("ledgerId", lid.toString());
    else params.delete("ledgerId");

    // Only set dates if they exist
    if (s) params.set("from", s);
    if (e) params.set("to", e);

    router.replace(`?${params.toString()}`);
  };

  // --- Formatters ---
  const formatBalance = (amount: number) => {
    if (amount === 0) return <span className="text-gray-400">0.00</span>;
    const absVal = Math.abs(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    if (amount < 0)
      return <span className="text-red-600 font-bold">{absVal} Dr</span>;
    return <span className="text-green-600 font-bold">{absVal} Cr</span>;
  };

  const formatAmount = (amount: number) =>
    amount === 0
      ? ""
      : Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Ledger Report
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View detailed transactions and running balances.
          </p>
        </div>

        {/* PRINT BUTTON - Updated Link */}
        {selectedLedgerId && (
          <Link
            href={`/print/ledger/${companyId}?ledgerId=${selectedLedgerId}&from=${fromDate}&to=${toDate}`}
            target="_blank"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer size={16} />
            Print Statement
          </Link>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end z-20 relative">
        {/* 1. COMBOBOX */}
        <div className="relative w-72">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Select Ledger Account
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-left text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="block truncate">
                {selectedLedger ? selectedLedger.name : "Select Ledger..."}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronsUpDown
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </span>
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm z-40">
                  <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-3 w-3 text-slate-400" />
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-md py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:border-blue-500"
                        placeholder="Search ledger..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  {filteredLedgers.length === 0 ? (
                    <div className="cursor-default select-none relative py-2 px-4 text-slate-500 italic text-xs">
                      No accounts found.
                    </div>
                  ) : (
                    filteredLedgers.map((ledger) => (
                      <div
                        key={ledger.id}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${
                          selectedLedgerId === ledger.id
                            ? "text-blue-900 bg-blue-50"
                            : "text-slate-900"
                        }`}
                        onClick={() => {
                          handleUpdate(ledger.id, start, end);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <span
                          className={`block truncate ${
                            selectedLedgerId === ledger.id
                              ? "font-bold"
                              : "font-normal"
                          }`}
                        >
                          {ledger.name}
                        </span>
                        {selectedLedgerId === ledger.id && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. DATE PICKERS */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            From Date
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              handleUpdate(selectedLedgerId, e.target.value, end);
            }}
            className="block w-40 rounded-lg border-slate-300 shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            To Date
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              handleUpdate(selectedLedgerId, start, e.target.value);
            }}
            className="block w-40 rounded-lg border-slate-300 shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* REPORT CONTENT */}
      {selectedLedger ? (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {selectedLedger.name}
              </h2>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Period: {format(new Date(fromDate), "dd MMM yyyy")} —{" "}
                {format(new Date(toDate), "dd MMM yyyy")}
              </div>
            </div>
            <div className="flex gap-8 bg-white px-6 py-3 rounded-lg border border-slate-200 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Opening Balance
                </p>
                <div className="text-lg">{formatBalance(openingBalance)}</div>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Closing Balance
                </p>
                <div className="text-lg">{formatBalance(closingBalance)}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-32">Date</th>
                  <th className="px-4 py-4 w-24">Type</th>
                  <th className="px-4 py-4 w-24">Vch No</th>
                  <th className="px-6 py-4">Narration</th>
                  <th className="px-6 py-4 text-right w-32">Debit (₹)</th>
                  <th className="px-6 py-4 text-right w-32">Credit (₹)</th>
                  <th className="px-6 py-4 text-right w-40">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* OPENING ROW */}
                <tr className="bg-yellow-50/50 font-bold text-slate-700">
                  <td
                    colSpan={6}
                    className="px-6 py-3 text-right uppercase text-xs tracking-widest"
                  >
                    Opening Balance B/F
                  </td>
                  <td className="px-6 py-3 text-right">
                    {formatBalance(openingBalance)}
                  </td>
                </tr>

                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-400 italic"
                    >
                      No transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={`${tx.type}-${tx.id}`}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-700">
                        {format(new Date(tx.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                            tx.type === "SALES"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : tx.type === "PAYMENT"
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : tx.type === "RECEIPT"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {tx.voucherNo}
                      </td>
                      <td
                        className="px-6 py-3 text-slate-600 max-w-xs truncate"
                        title={tx.narration || ""}
                      >
                        {tx.narration || "-"}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">
                        {tx.amount < 0 ? formatAmount(tx.amount) : ""}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">
                        {tx.amount > 0 ? formatAmount(tx.amount) : ""}
                      </td>
                      <td className="px-6 py-3 text-right font-bold font-mono">
                        {formatBalance(tx.balance)}
                      </td>
                    </tr>
                  ))
                )}

                {/* CLOSING ROW */}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-right uppercase text-xs tracking-widest"
                  >
                    Total Closing
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                    {formatAmount(
                      transactions.reduce(
                        (s, t) => s + (t.amount < 0 ? t.amount : 0),
                        0
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600">
                    {formatAmount(
                      transactions.reduce(
                        (s, t) => s + (t.amount > 0 ? t.amount : 0),
                        0
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-lg">
                    {formatBalance(closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="font-medium">Select a Ledger to view the report</p>
        </div>
      )}
    </div>
  );
}
