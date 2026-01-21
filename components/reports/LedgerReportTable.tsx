"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Settings, CheckSquare, Square } from "lucide-react";

export default function LedgerReportTable({
  transactions,
  companyId,
  periodDebit,
  periodCredit,
  closingBalance,
  openingBalance,
  fromDate,
  periodQty, // ✅ FIXED: Added missing prop here
}: any) {
  // --- STATE: Column Visibility ---
  const [showInventory, setShowInventory] = useState(true);
  const [showNarration, setShowNarration] = useState(true);
  const [showVoucherNo, setShowVoucherNo] = useState(true);
  const [showRunningBalance, setShowRunningBalance] = useState(true);

  // --- STATE: Config Menu Toggle ---
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px] relative">
      {/* --- TABLE HEADER & CONFIG --- */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20">
        {/* CONFIG BUTTON & DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all ${
              isConfigOpen
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Settings
              size={14}
              className={isConfigOpen ? "text-indigo-600" : "text-slate-400"}
            />
            <span>Table Config</span>
          </button>

          {/* DROPDOWN MENU LOGIC */}
          {isConfigOpen && (
            <>
              {/* Invisible Backdrop to close menu on click outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsConfigOpen(false)}
              />

              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                  Column Visibility
                </div>
                <div className="space-y-0.5">
                  <ConfigOption
                    label="Item Details"
                    active={showInventory}
                    onClick={() => setShowInventory(!showInventory)}
                  />
                  <ConfigOption
                    label="Narration"
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

        <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          {transactions.length} Transactions Found
        </span>
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
                  <th className="px-4 py-4 w-48 border-l border-slate-200">
                    Item
                  </th>
                  <th className="px-4 py-4 w-20 text-right">Qty</th>
                </>
              )}
              <th className="px-4 py-4 text-right w-32 text-rose-700 bg-rose-50/30 border-l border-rose-100/50 uppercase font-black tracking-widest">
                Debit (Dr)
              </th>
              <th className="px-4 py-4 text-right w-32 text-emerald-700 bg-emerald-50/30 border-l border-emerald-100/50 uppercase font-black tracking-widest">
                Credit (Cr)
              </th>
              {showRunningBalance && (
                <th className="px-4 py-4 text-right w-36 text-slate-700 bg-slate-100/50 border-l border-slate-200 pr-6 uppercase font-black tracking-widest">
                  Balance
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* --- OPENING BALANCE ROW --- */}
            <tr className="bg-amber-50/40 font-bold text-xs">
              <td className="px-4 py-3 text-slate-400 pl-6">
                {format(new Date(fromDate), "dd MMM yy")}
              </td>
              {/* Dynamic ColSpan based on visible columns */}
              <td
                colSpan={2 + (showVoucherNo ? 1 : 0) + 2} // TXID + VchNo? + Type + Particulars
                className="px-4 py-3 text-slate-600 italic"
              >
                Opening Balance Brought Forward
              </td>
              {showInventory && (
                <>
                  <td className="px-4 py-3 border-l border-slate-100"></td>
                  <td className="px-4 py-3"></td>
                </>
              )}

              {/* OPENING BALANCE LOGIC */}
              <td className="px-4 py-3 text-right text-rose-700 bg-rose-50/10 font-mono">
                {openingBalance <= 0 ? formatMoney(openingBalance) : ""}
              </td>
              <td className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/10 font-mono">
                {openingBalance > 0 ? formatMoney(openingBalance) : ""}
              </td>

              {showRunningBalance && (
                <td className="px-4 py-3 text-right font-black text-slate-800 bg-slate-50/50 border-l border-slate-200 pr-6 font-mono">
                  {formatMoney(openingBalance)}
                  <span
                    className={`ml-1 px-1 rounded text-[9px] ${
                      openingBalance <= 0
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {openingBalance <= 0 ? "Dr" : "Cr"}
                  </span>
                </td>
              )}
            </tr>

            {transactions.map((tx: any) => {
              const displayDebit = tx.amount < 0 ? Math.abs(tx.amount) : 0;
              const displayCredit = tx.amount > 0 ? tx.amount : 0;

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-500 pl-6">
                    {format(new Date(tx.date), "dd MMM yy")}
                  </td>
                  <td className="px-4 py-3.5 text-center align-top">
                    <span className="font-mono text-[9px] text-slate-400">
                      {tx.txid}
                    </span>
                  </td>
                  {showVoucherNo && (
                    <td className="px-4 py-3.5 text-xs font-mono">
                      #{tx.voucherNo}
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="text-sm font-semibold text-slate-800">
                      {tx.particulars}
                    </div>
                    {showNarration && tx.narration && (
                      <div className="text-[10px] text-slate-400 mt-1 italic pl-2 border-l-2 border-slate-100">
                        {tx.narration}
                      </div>
                    )}
                  </td>
                  {showInventory && (
                    <>
                      <td className="px-4 py-3.5 text-xs border-l border-slate-100 truncate max-w-[180px] text-slate-500">
                        {tx.itemName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500">
                        {tx.quantity || "-"}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-rose-700 bg-rose-50/5 border-l border-rose-100/30">
                    {displayDebit > 0 ? formatMoney(displayDebit) : ""}
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-700 bg-emerald-50/5 border-l border-emerald-100/30">
                    {displayCredit > 0 ? formatMoney(displayCredit) : ""}
                  </td>

                  {showRunningBalance && (
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-800 bg-slate-50/30 border-l border-slate-200 pr-6">
                      {formatMoney(tx.balance)}
                      <span
                        className={`ml-1 px-1 rounded text-[9px] font-black ${
                          tx.balance <= 0
                            ? "bg-rose-50 text-rose-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {tx.balance <= 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* --- TABLE FOOTER --- */}
          <tfoot className="bg-slate-100 font-black text-xs sticky bottom-0 border-t-2 border-slate-300 shadow-lg">
            <tr>
              <td
                colSpan={2 + (showVoucherNo ? 1 : 0) + 2} // Same logic as header
                className="px-4 py-5 text-right uppercase text-slate-400 pl-6 tracking-widest"
              >
                Total Period Movement
              </td>
              {showInventory && (
                <>
                  <td className="px-4 py-5 border-l border-slate-200 bg-slate-200/20"></td>
                  <td className="px-4 py-5 text-right font-mono bg-slate-200/20">
                    {periodQty}
                  </td>
                </>
              )}
              <td className="px-4 py-5 text-right text-rose-700 border-l border-slate-200 font-mono">
                {formatMoney(periodDebit)}
              </td>
              <td className="px-4 py-5 text-right text-emerald-700 border-l border-slate-200 font-mono">
                {formatMoney(periodCredit)}
              </td>
              {showRunningBalance && (
                <td className="px-4 py-5 text-right text-slate-900 border-l border-slate-200 pr-6 font-mono bg-slate-200/30">
                  {formatMoney(closingBalance)}
                  <span
                    className={`ml-1 px-1 rounded text-[10px] ${
                      closingBalance <= 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {closingBalance <= 0 ? "Dr" : "Cr"}
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
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all group"
    >
      <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600">
        {label}
      </span>
      {active ? (
        <CheckSquare size={16} className="text-indigo-600" />
      ) : (
        <Square
          size={16}
          className="text-slate-300 group-hover:text-slate-400"
        />
      )}
    </button>
  );
}
