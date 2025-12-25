"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  FileText,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

// Define the shape of your Voucher data
interface Voucher {
  id: number;
  date: Date | string;
  type: string;
  voucherNo: string;
  transactionCode: string | null;
  narration: string | null;
  totalAmount: number | null;
  entries: any[];
}

interface Props {
  vouchers: Voucher[];
}

export default function VoucherList({ vouchers = [] }: Props) {
  const [searchId, setSearchId] = useState("");

  // Filter the vouchers based on Transaction ID
  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchId) return true;
    return (
      voucher.transactionCode?.toLowerCase().includes(searchId.toLowerCase()) ||
      voucher.voucherNo.toLowerCase().includes(searchId.toLowerCase())
    );
  });

  // Helper to format currency
  const formatMoney = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* HEADER & SEARCH */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          Day Book / Voucher List
        </h2>

        {/* --- SEARCH BOX --- */}
        <div className="relative group w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Search TXID or Voucher No..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Date
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-32">
                Trans ID
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-32">
                Voucher No
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-24">
                Type
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Particulars
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right w-32">
                Debit (In)
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right w-32">
                Credit (Out)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <Search size={48} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      No vouchers found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching for a different Transaction ID
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => {
                const amt = voucher.totalAmount || 0;

                // --- LOGIC TO FIX BLANK AMOUNTS ---
                let debitAmount = 0;
                let creditAmount = 0;

                if (voucher.type === "RECEIPT" || voucher.type === "PURCHASE") {
                  debitAmount = amt;
                } else if (
                  voucher.type === "PAYMENT" ||
                  voucher.type === "SALES"
                ) {
                  creditAmount = amt;
                } else if (voucher.type === "CONTRA") {
                  debitAmount = amt; // Simplified view
                } else {
                  debitAmount = amt;
                }

                return (
                  <tr
                    key={voucher.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-xs font-bold text-slate-600 whitespace-nowrap">
                      {format(new Date(voucher.date), "dd MMM yyyy")}
                    </td>

                    {/* --- TRANSACTION ID --- */}
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {voucher.transactionCode || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-xs font-bold text-slate-700">
                      #{voucher.voucherNo}
                    </td>

                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide border 
                          ${
                            voucher.type === "SALES"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : voucher.type === "PAYMENT"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : voucher.type === "RECEIPT"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : voucher.type === "PURCHASE"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                      >
                        {voucher.type === "SALES" && <ArrowUpRight size={10} />}
                        {voucher.type === "PURCHASE" && (
                          <ArrowDownLeft size={10} />
                        )}
                        {voucher.type === "CONTRA" && (
                          <ArrowRightLeft size={10} />
                        )}
                        {voucher.type.slice(0, 4)}
                      </span>
                    </td>

                    <td
                      className="px-6 py-3.5 text-xs text-slate-600 font-medium max-w-xs truncate"
                      title={voucher.narration || ""}
                    >
                      {voucher.narration || (
                        <span className="text-slate-300 italic">
                          No narration
                        </span>
                      )}
                    </td>

                    {/* --- DEBIT COLUMN --- */}
                    <td className="px-6 py-3.5 text-right font-mono text-xs font-bold text-emerald-700 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                      {debitAmount > 0 ? (
                        formatMoney(debitAmount)
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>

                    {/* --- CREDIT COLUMN --- */}
                    <td className="px-6 py-3.5 text-right font-mono text-xs font-bold text-rose-700 bg-rose-50/5 group-hover:bg-rose-50/20 transition-colors">
                      {creditAmount > 0 ? (
                        formatMoney(creditAmount)
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
