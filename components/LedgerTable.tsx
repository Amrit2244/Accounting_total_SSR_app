"use client";

import React, { useState } from "react";

// 1. Define the shapes of the data (matching what your page fetches)
interface Entry {
  id: number;
  amount: number;
  ledgerName?: string | null; // Optional if not always present
  ledger?: { name: string }; // From the include: { ledger: true }
}

interface Voucher {
  id: number;
  date: Date | string;
  type: string;
  voucherNo: string;
  transactionCode: string | null;
  narration: string | null;
  totalAmount: number | null;
  entries: Entry[];
}

interface Props {
  vouchers: Voucher[];
  companyId: number;
}

export default function VoucherTable({ vouchers = [], companyId }: Props) {
  const [searchId, setSearchId] = useState("");

  // Filter vouchers by Transaction ID if search is typed
  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchId) return true;
    return voucher.transactionCode
      ?.toLowerCase()
      .includes(searchId.toLowerCase());
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
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
      {/* Search Bar Area */}
      <div className="p-4 border-b border-gray-200 flex gap-4">
        <input
          type="text"
          placeholder="Search Transaction ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border border-gray-300 p-2 rounded text-sm w-64 focus:outline-none focus:border-[#003366]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
            <tr>
              <th className="p-3 border-b">Date</th>
              <th className="p-3 border-b">Trans ID</th>
              <th className="p-3 border-b">Voucher No</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">Particulars</th>
              <th className="p-3 border-b text-right">Debit (In)</th>
              <th className="p-3 border-b text-right">Credit (Out)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No vouchers found.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => {
                const amt = voucher.totalAmount || 0;

                // --- LOGIC TO FIX BLANK AMOUNTS ---
                let debitAmount = 0;
                let creditAmount = 0;

                // Basic logic:
                // Receipt/Contra = Debit side
                // Payment/Sales = Credit side (usually)
                if (
                  voucher.type === "RECEIPT" ||
                  voucher.type === "PURCHASE" ||
                  voucher.type === "CONTRA"
                ) {
                  debitAmount = amt;
                } else {
                  creditAmount = amt;
                }

                // If specific entries exist, we might want to grab the "Party" name
                // For simplified view, we just take the first entry's ledger name or narration
                const displayParticulars =
                  voucher.entries.length > 0
                    ? voucher.entries[0].ledger?.name ||
                      voucher.entries[0].ledgerName
                    : voucher.narration;

                return (
                  <tr
                    key={voucher.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap text-gray-600">
                      {new Date(voucher.date).toLocaleDateString("en-IN")}
                    </td>

                    {/* Transaction ID */}
                    <td className="p-3 font-mono text-xs text-blue-600">
                      {voucher.transactionCode || "-"}
                    </td>

                    <td className="p-3 text-gray-800 font-medium">
                      {voucher.voucherNo}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          voucher.type === "SALES"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : voucher.type === "PAYMENT"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {voucher.type}
                      </span>
                    </td>

                    <td className="p-3 text-gray-600 max-w-xs truncate">
                      {displayParticulars ||
                        voucher.narration ||
                        "View Details"}
                    </td>

                    {/* Debit */}
                    <td className="p-3 text-right font-medium text-gray-800">
                      {debitAmount > 0 ? formatMoney(debitAmount) : ""}
                    </td>

                    {/* Credit */}
                    <td className="p-3 text-right font-medium text-gray-800">
                      {creditAmount > 0 ? formatMoney(creditAmount) : ""}
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
