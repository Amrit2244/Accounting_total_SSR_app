"use client";

import React, { useState } from "react";
import { format } from "date-fns"; // Make sure you have date-fns installed, or use standard JS date

// Define the shape of your Voucher data
interface Voucher {
  id: number;
  date: Date | string;
  type: string;
  voucherNo: string;
  transactionCode: string | null;
  narration: string | null;
  totalAmount: number | null; // This is the field we fixed in the import
  entries: any[]; // Array of entries if you need them for details
}

interface Props {
  vouchers: Voucher[];
}

export default function VoucherList({ vouchers = [] }: Props) {
  const [searchId, setSearchId] = useState("");

  // Filter the vouchers based on Transaction ID
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
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Day Book / Voucher List</h2>

        {/* --- SEARCH BOX ENABLED --- */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search Transaction ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border border-gray-300 p-2 rounded w-64 focus:outline-none focus:border-blue-500"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => {}} // Optional: Add specific click logic if needed, but filter is automatic
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Date</th>
              {/* --- TRANSACTION ID COLUMN RESTORED --- */}
              <th className="p-2 border text-left">Trans ID</th>
              <th className="p-2 border text-left">Voucher No</th>
              <th className="p-2 border text-left">Type</th>
              <th className="p-2 border text-left">Particulars</th>
              <th className="p-2 border text-right">Debit (In)</th>
              <th className="p-2 border text-right">Credit (Out)</th>
            </tr>
          </thead>
          <tbody>
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No vouchers found.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => {
                const amt = voucher.totalAmount || 0;

                // --- LOGIC TO FIX BLANK AMOUNTS ---
                // We decide where to put the amount based on Voucher Type
                let debitAmount = 0;
                let creditAmount = 0;

                if (voucher.type === "RECEIPT" || voucher.type === "PURCHASE") {
                  // Receipt = Money In (Debit), Purchase = Asset In (Debit)
                  debitAmount = amt;
                } else if (
                  voucher.type === "PAYMENT" ||
                  voucher.type === "SALES"
                ) {
                  // Payment = Money Out (Credit), Sales = Revenue (Credit)
                  creditAmount = amt;
                } else if (voucher.type === "CONTRA") {
                  // Contra is tricky, usually shows both, but for summary we can default to Debit
                  debitAmount = amt;
                } else {
                  // Journal or others
                  debitAmount = amt;
                }

                return (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {new Date(voucher.date).toLocaleDateString("en-IN")}
                    </td>

                    {/* --- TRANSACTION ID DISPLAY --- */}
                    <td className="p-2 border font-mono text-sm text-gray-600">
                      {voucher.transactionCode || "-"}
                    </td>

                    <td className="p-2 border">{voucher.voucherNo}</td>
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          voucher.type === "SALES"
                            ? "bg-green-100 text-green-800"
                            : voucher.type === "PAYMENT"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {voucher.type}
                      </span>
                    </td>
                    <td className="p-2 border text-sm text-gray-600 max-w-xs truncate">
                      {/* Display Narration or Ledger Name here if available */}
                      {voucher.narration || "View Details"}
                    </td>

                    {/* --- DEBIT COLUMN --- */}
                    <td className="p-2 border text-right font-medium">
                      {debitAmount > 0 ? formatMoney(debitAmount) : ""}
                    </td>

                    {/* --- CREDIT COLUMN --- */}
                    <td className="p-2 border text-right font-medium">
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
