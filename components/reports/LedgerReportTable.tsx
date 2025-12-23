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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px]">
      {/* --- TABLE HEADER WITH CONFIG BUTTON --- */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* Configuration Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200"
            >
              <Settings size={14} />
              <span>F12: Configure</span>
            </button>

            {/* Config Popup */}
            {isConfigOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsConfigOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 p-2 animate-in fade-in zoom-in duration-200">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">
                    Show Columns
                  </div>
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
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">
            {transactions.length} Transactions
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-24">Date</th>
              <th className="px-4 py-3 w-16 text-center">TXID</th>
              {showVoucherNo && <th className="px-4 py-3 w-24">Vch No</th>}
              <th className="px-4 py-3 w-20">Type</th>
              <th className="px-4 py-3 min-w-[200px]">Particulars</th>

              {/* Conditional Inventory Headers */}
              {showInventory && (
                <>
                  <th className="px-4 py-3 w-40 text-slate-600 bg-slate-100/30 border-l border-slate-200/50">
                    Item
                  </th>
                  <th className="px-4 py-3 w-16 text-right text-slate-600 bg-slate-100/30">
                    Qty
                  </th>
                </>
              )}

              <th className="px-4 py-3 text-right w-28 text-emerald-600 bg-emerald-50/30 border-l border-emerald-100/50">
                Debit
              </th>
              <th className="px-4 py-3 text-right w-28 text-rose-600 bg-rose-50/30 border-l border-rose-100/50">
                Credit
              </th>
              {showRunningBalance && (
                <th className="px-4 py-3 text-right w-32 text-slate-700 bg-slate-100/50 border-l border-slate-200">
                  Balance
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Opening Balance Row */}
            <tr className="bg-yellow-50/40 hover:bg-yellow-50/60 transition-colors">
              <td className="px-4 py-3 font-bold text-slate-400 text-xs">
                {format(new Date(fromDate), "dd MMM yy")}
              </td>
              <td
                colSpan={showVoucherNo ? 3 : 2}
                className="px-4 py-3 font-bold text-slate-600 italic text-xs"
              >
                Opening Balance
              </td>
              <td className="px-4 py-3 bg-slate-50/20 border-l border-slate-100/50"></td>
              {showInventory && (
                <>
                  <td className="px-4 py-3 bg-slate-50/20 border-l border-slate-100/50"></td>
                  <td className="px-4 py-3 bg-slate-50/20"></td>
                </>
              )}
              <td className="px-4 py-3 bg-emerald-50/10 border-l border-emerald-100/20"></td>
              <td className="px-4 py-3 bg-rose-50/10 border-l border-rose-100/20"></td>
              {showRunningBalance && (
                <td className="px-4 py-3 text-right font-black font-mono text-xs text-slate-800 bg-slate-50/40 border-l border-slate-100">
                  {formatMoney(openingBalance)}{" "}
                  <span className="text-[9px] text-slate-400">
                    {openingBalance < 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              )}
            </tr>

            {transactions.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <FileText size={48} className="text-slate-300 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                      No transactions in this period
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx: any) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-blue-50/20 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap align-top">
                    {format(new Date(tx.date), "dd MMM yy")}
                  </td>
                  <td className="px-4 py-3 text-center align-top">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {tx.txid}
                    </span>
                  </td>
                  {showVoucherNo && (
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/companies/${companyId}/vouchers/${tx.type}/${tx.voucherId}/edit`}
                        className="font-mono text-[11px] font-bold text-slate-700 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        #{tx.voucherNo}
                      </Link>
                    </td>
                  )}
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm 
                        ${
                          tx.type === "SALES"
                            ? "bg-emerald-100 text-emerald-700"
                            : tx.type === "PURCHASE"
                            ? "bg-blue-100 text-blue-700"
                            : tx.type === "RECEIPT"
                            ? "bg-orange-100 text-orange-700"
                            : tx.type === "PAYMENT"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {tx.type.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-semibold text-slate-800 leading-snug">
                      {tx.particulars}
                    </div>
                    {showNarration && tx.narration && (
                      <div className="text-[11px] text-slate-500 mt-1 font-medium italic leading-tight">
                        <span className="text-[9px] font-bold text-slate-300 uppercase not-italic mr-1">
                          Narration:
                        </span>
                        {tx.narration}
                      </div>
                    )}
                  </td>

                  {/* Conditional Inventory Cells */}
                  {showInventory && (
                    <>
                      <td className="px-4 py-3 text-xs text-slate-600 bg-slate-50/10 border-l border-slate-100/50 align-top">
                        {tx.itemNames !== "-" ? (
                          <div className="flex items-start gap-1">
                            <Package
                              size={12}
                              className="mt-0.5 text-slate-300 shrink-0"
                            />
                            <span className="truncate max-w-[150px] block">
                              {tx.itemNames}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-600 bg-slate-50/10 align-top">
                        {tx.quantity > 0 ? tx.quantity : "-"}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-700 bg-emerald-50/5 group-hover:bg-emerald-50/20 border-l border-emerald-100/30 transition-colors align-top">
                    {tx.debit > 0 ? formatMoney(tx.debit) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-rose-700 bg-rose-50/5 group-hover:bg-rose-50/20 border-l border-rose-100/30 transition-colors align-top">
                    {tx.credit < 0 ? formatMoney(tx.credit) : "-"}
                  </td>
                  {showRunningBalance && (
                    <td className="px-4 py-3 text-right font-mono text-xs font-black text-slate-800 bg-slate-50/40 group-hover:bg-slate-100/50 border-l border-slate-200 transition-colors align-top">
                      {formatMoney(tx.balance)}{" "}
                      <span className="text-[9px] font-bold text-slate-400 ml-0.5">
                        {tx.balance < 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-slate-700 text-xs">
            <tr>
              <td
                colSpan={showVoucherNo ? 5 : 4}
                className="px-4 py-4 text-right uppercase tracking-widest text-[10px] text-slate-400"
              >
                Total Period Movement
              </td>
              {showInventory && (
                <>
                  <td className="px-4 py-4 border-l border-slate-200"></td>
                  <td className="px-4 py-4 text-right font-mono text-slate-600">
                    {periodQty > 0 ? periodQty : "-"}
                  </td>
                </>
              )}
              <td className="px-4 py-4 text-right font-mono text-emerald-700 border-l border-slate-200">
                {formatMoney(periodDebit)}
              </td>
              <td className="px-4 py-4 text-right font-mono text-rose-700">
                {formatMoney(periodCredit)}
              </td>
              {showRunningBalance && (
                <td className="px-4 py-4 text-right font-mono text-blue-700 bg-blue-50/30">
                  {formatMoney(closingBalance)}
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
      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg group transition-colors"
    >
      <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
        {label}
      </span>
      {active ? (
        <CheckSquare size={14} className="text-blue-600" />
      ) : (
        <Square size={14} className="text-slate-300" />
      )}
    </button>
  );
}
