"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Settings,
  CheckSquare,
  Square,
  FileText,
  Filter,
} from "lucide-react";

export default function LedgerReportTable({
  transactions,
  companyId,
  periodDebit,
  periodCredit,
  periodQty,
  closingBalance,
  openingBalance,
  fromDate,
}: any) {
  // --- Tally-like Configuration State ---
  const [showInventory, setShowInventory] = useState(true);
  const [showNarration, setShowNarration] = useState(true);
  const [showVoucherNo, setShowVoucherNo] = useState(true);
  const [showRunningBalance, setShowRunningBalance] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px] relative">
      {/* --- TABLE HEADER WITH CONFIG BUTTON --- */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* Configuration Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm active:scale-95"
            >
              <Settings size={14} className="text-slate-400" />
              <span>Table Config</span>
            </button>

            {/* Config Popup */}
            {isConfigOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsConfigOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 p-3 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mb-1 border-b border-slate-50 flex items-center gap-2">
                    <Filter size={10} /> View Options
                  </div>
                  <div className="space-y-1 mt-1">
                    <ConfigOption
                      label="Inventory Details"
                      active={showInventory}
                      onClick={() => setShowInventory(!showInventory)}
                    />
                    <ConfigOption
                      label="Narrations"
                      active={showNarration}
                      onClick={() => setShowNarration(!showNarration)}
                    />
                    <ConfigOption
                      label="Voucher No"
                      active={showVoucherNo}
                      onClick={() => setShowVoucherNo(!showVoucherNo)}
                    />
                    <ConfigOption
                      label="Running Balance"
                      active={showRunningBalance}
                      onClick={() => setShowRunningBalance(!showRunningBalance)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 tracking-wide">
            {transactions.length} Transactions Found
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-4 py-4 w-28 pl-6">Date</th>
              <th className="px-4 py-4 w-20 text-center">TXID</th>
              {showVoucherNo && <th className="px-4 py-4 w-28">Vch No</th>}
              <th className="px-4 py-4 w-24">Type</th>
              <th className="px-4 py-4 min-w-[250px]">Particulars</th>

              {showInventory && (
                <>
                  <th className="px-4 py-4 w-48 text-slate-600 bg-slate-100/50 border-l border-slate-200">
                    Item
                  </th>
                  <th className="px-4 py-4 w-20 text-right text-slate-600 bg-slate-100/50">
                    Qty
                  </th>
                </>
              )}

              <th className="px-4 py-4 text-right w-32 text-rose-700 bg-rose-50/30 border-l border-rose-100/50">
                Debit (Dr)
              </th>
              <th className="px-4 py-4 text-right w-32 text-emerald-700 bg-emerald-50/30 border-l border-emerald-100/50">
                Credit (Cr)
              </th>
              {showRunningBalance && (
                <th className="px-4 py-4 text-right w-36 text-slate-700 bg-slate-100/50 border-l border-slate-200 pr-6">
                  Balance
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Opening Balance Row */}
            <tr className="bg-amber-50/40 hover:bg-amber-50/60 transition-colors group">
              <td className="px-4 py-3 font-bold text-slate-400 text-xs pl-6">
                {format(new Date(fromDate), "dd MMM yy")}
              </td>
              <td
                colSpan={showVoucherNo ? 3 : 2}
                className="px-4 py-3 font-bold text-slate-600 italic text-xs"
              >
                Opening Balance Brought Forward
              </td>
              <td className="px-4 py-3 bg-slate-50/30 border-l border-slate-100"></td>
              {showInventory && (
                <>
                  <td className="px-4 py-3 bg-slate-50/30 border-l border-slate-100"></td>
                  <td className="px-4 py-3 bg-slate-50/30"></td>
                </>
              )}

              {/* Opening Balance Alignment with correct colors */}
              <td className="px-4 py-3 text-right font-mono text-xs font-bold text-rose-600 bg-rose-50/10">
                {openingBalance < 0 ? formatMoney(openingBalance) : ""}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600 bg-emerald-50/10">
                {openingBalance > 0 ? formatMoney(openingBalance) : ""}
              </td>

              {showRunningBalance && (
                <td className="px-4 py-3 text-right font-black font-mono text-xs text-slate-800 bg-slate-50/50 border-l border-slate-200 pr-6">
                  {formatMoney(openingBalance)}{" "}
                  <span
                    className={`text-[9px] font-bold ml-1 ${
                      openingBalance < 0 ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {openingBalance < 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              )}
            </tr>

            {transactions.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <FileText
                      size={64}
                      className="text-slate-300 mb-4"
                      strokeWidth={1}
                    />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      No transactions recorded in this period
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx: any) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-500 whitespace-nowrap align-top pl-6">
                    {format(new Date(tx.date), "dd MMM yy")}
                  </td>
                  <td className="px-4 py-3.5 text-center align-top">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:bg-white transition-colors">
                      {tx.txid}
                    </span>
                  </td>
                  {showVoucherNo && (
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono text-[11px] font-bold text-slate-600">
                        #{tx.voucherNo}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5 align-top">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border 
                        ${
                          tx.type === "SALES"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : tx.type === "PURCHASE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : tx.type === "RECEIPT"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : tx.type === "PAYMENT"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    >
                      {tx.type.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="text-sm font-semibold text-slate-800 leading-snug">
                      {tx.particulars}
                    </div>
                    {/* CLEANER NARRATION STYLING */}
                    {showNarration && tx.narration && (
                      <div className="text-[10px] text-slate-400 mt-1.5 italic font-medium leading-relaxed pl-2 border-l-2 border-slate-100 max-w-md">
                        {tx.narration}
                      </div>
                    )}
                  </td>

                  {showInventory && (
                    <>
                      <td className="px-4 py-3.5 text-xs text-slate-600 bg-slate-50/20 group-hover:bg-slate-50/50 border-l border-slate-100 align-top">
                        {tx.itemNames && tx.itemNames !== "-" ? (
                          <div className="flex items-start gap-2">
                            <Package
                              size={14}
                              className="mt-0.5 text-slate-300 shrink-0"
                            />
                            <span className="truncate max-w-[180px] block font-medium">
                              {tx.itemNames}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 ml-6">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-600 bg-slate-50/20 group-hover:bg-slate-50/50 align-top">
                        {tx.quantity > 0 ? tx.quantity : "-"}
                      </td>
                    </>
                  )}

                  {/* DEBIT COLUMN - RED (ROSE) */}
                  <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-rose-700 bg-rose-50/5 group-hover:bg-rose-50/20 border-l border-rose-100/30 transition-colors align-top">
                    {tx.debit > 0 ? formatMoney(tx.debit) : ""}
                  </td>
                  {/* CREDIT COLUMN - GREEN (EMERALD) */}
                  <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-700 bg-emerald-50/5 group-hover:bg-emerald-50/20 border-l border-emerald-100/30 transition-colors align-top">
                    {tx.credit > 0 ? formatMoney(tx.credit) : ""}
                  </td>

                  {showRunningBalance && (
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-800 bg-slate-50/30 group-hover:bg-slate-100/50 border-l border-slate-200 transition-colors align-top pr-6">
                      {formatMoney(tx.balance)}{" "}
                      <span
                        className={`text-[9px] font-black uppercase ml-1 px-1 rounded ${
                          tx.balance < 0
                            ? "text-rose-500 bg-rose-50"
                            : "text-emerald-500 bg-emerald-50"
                        }`}
                      >
                        {tx.balance < 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-slate-700 text-xs sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <tr>
              <td
                colSpan={showVoucherNo ? 5 : 4}
                className="px-4 py-4 text-right uppercase tracking-widest text-slate-400 pl-6"
              >
                Total Period Movement
              </td>
              {showInventory && (
                <>
                  <td className="px-4 py-4 border-l border-slate-200 bg-slate-100/50"></td>
                  <td className="px-4 py-4 text-right font-mono text-slate-600 bg-slate-100/50">
                    {periodQty > 0 ? periodQty : "-"}
                  </td>
                </>
              )}
              {/* FOOTER TOTAL COLORS */}
              <td className="px-4 py-4 text-right font-mono text-rose-700 border-l border-slate-200 bg-rose-50/20">
                {formatMoney(periodDebit)}
              </td>
              <td className="px-4 py-4 text-right font-mono text-emerald-700 bg-emerald-50/20 border-l border-slate-200">
                {formatMoney(periodCredit)}
              </td>
              {showRunningBalance && (
                <td className="px-4 py-4 text-right font-mono text-indigo-700 bg-indigo-50/30 border-l border-slate-200 pr-6">
                  {formatMoney(closingBalance)}
                  <span
                    className={`text-[9px] font-black uppercase ml-1 ${
                      closingBalance < 0 ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {closingBalance < 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ConfigOption({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl group transition-all"
    >
      <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
        {label}
      </span>
      {active ? (
        <CheckSquare size={16} className="text-indigo-600 fill-indigo-50" />
      ) : (
        <Square
          size={16}
          className="text-slate-300 group-hover:text-slate-400"
        />
      )}
    </button>
  );
}
