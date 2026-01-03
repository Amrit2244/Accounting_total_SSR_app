"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  FileText,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Voucher {
  id: number;
  date: Date | string;
  type: string;
  voucherNo: string;
  transactionCode: string | null;
  narration: string | null;
  totalAmount: number | null;
  status: string; // Added status field
  entries: any[];
}

interface Props {
  vouchers: Voucher[];
}

export default function VoucherList({ vouchers = [] }: Props) {
  const [searchId, setSearchId] = useState("");

  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchId) return true;
    return (
      voucher.transactionCode?.toLowerCase().includes(searchId.toLowerCase()) ||
      voucher.voucherNo.toLowerCase().includes(searchId.toLowerCase())
    );
  });

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
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            Transaction Register
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
            Showing {filteredVouchers.length} Total Records
          </p>
        </div>

        <div className="relative group w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Filter by TXID or No..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Date
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Vch No.
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Type
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Status
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">
                Debit (Dr)
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">
                Credit (Cr)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVouchers.map((voucher) => {
              const amt = voucher.totalAmount || 0;
              const isApproved = voucher.status === "APPROVED";

              // Logic for accounting classification
              let debitAmount = 0;
              let creditAmount = 0;

              if (["RECEIPT", "PURCHASE", "CONTRA"].includes(voucher.type)) {
                debitAmount = amt;
              } else {
                creditAmount = amt;
              }

              return (
                <tr
                  key={voucher.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">
                    {format(new Date(voucher.date), "dd MMM yyyy")}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100">
                      {voucher.transactionCode || "NO-ID"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    #{voucher.voucherNo}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border 
                        ${
                          voucher.type === "SALES"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : voucher.type === "PURCHASE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                    >
                      {voucher.type.slice(0, 4)}
                    </span>
                  </td>

                  {/* --- NEW STATUS COLUMN --- */}
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border
                      ${
                        isApproved
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      {isApproved ? (
                        <ShieldCheck size={10} />
                      ) : (
                        <Clock size={10} className="animate-pulse" />
                      )}
                      {isApproved ? "Verified" : "Pending"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-xs font-bold text-emerald-700">
                    {debitAmount > 0 ? (
                      formatMoney(debitAmount)
                    ) : (
                      <span className="opacity-20">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-xs font-bold text-rose-700">
                    {creditAmount > 0 ? (
                      formatMoney(creditAmount)
                    ) : (
                      <span className="opacity-20">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER SUMMARY */}
      <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Admin Engine v1.2
            </span>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Secure Accounting Kernel Active
        </p>
      </div>
    </div>
  );
}
