"use client";

import React, { useState } from "react";
import Link from "next/link"; // Added Link for editing/viewing vouchers
import { ArrowRight, Search, FileEdit } from "lucide-react";

// 1. Define the shapes of the data (matching what your page fetches)
interface Entry {
  id: number;
  amount: number; // Positive for Debit, Negative for Credit (Standard Practice)
  ledgerName?: string | null; // Fallback name
  ledger?: { name: string }; // From the include: { ledger: true }
}

interface Voucher {
  id: number;
  date: Date | string;
  type: string;
  voucherNo: string;
  transactionCode: string | null;
  narration: string | null;
  totalAmount: number | null; // This is often total Debit/Credit
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
    if (amount === null || amount === undefined) return "";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  // Helper to determine tailwind classes for the voucher type badge
  const getVoucherTypeClasses = (type: string) => {
    switch (type) {
      case "SALES":
      case "RECEIPT":
        return "bg-green-50 text-green-700 border-green-200";
      case "PURCHASE":
      case "PAYMENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "JOURNAL":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-lg">
      {/* Search Bar Area */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search Transaction ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="p-2 text-sm w-64 focus:outline-none placeholder-gray-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="p-3 border-b w-[80px]">Date</th>
              <th className="p-3 border-b w-[120px]">Trans ID</th>
              <th className="p-3 border-b w-[80px]">Vch No</th>
              <th className="p-3 border-b w-[80px]">Type</th>
              <th className="p-3 border-b w-auto">Particulars</th>
              <th className="p-3 border-b text-right w-[150px]">Debit (₹)</th>
              <th className="p-3 border-b text-right w-[150px]">Credit (₹)</th>
              <th className="p-3 border-b text-center w-[50px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No vouchers found matching your search.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => (
                <React.Fragment key={voucher.id}>
                  {voucher.entries.map((entry, index) => {
                    const isFirstRow = index === 0;

                    // Determine Debit/Credit based on entry amount sign
                    const debitAmount = entry.amount > 0 ? entry.amount : 0;
                    const creditAmount =
                      entry.amount < 0 ? Math.abs(entry.amount) : 0;

                    const particulars =
                      entry.ledger?.name || entry.ledgerName || "N/A";

                    return (
                      <tr
                        key={entry.id}
                        className={
                          isFirstRow
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                      >
                        {/* --- Voucher Meta Data (Only on First Row) --- */}
                        {isFirstRow ? (
                          <>
                            <td
                              className="p-3 whitespace-nowrap text-gray-700"
                              rowSpan={voucher.entries.length}
                            >
                              {new Date(voucher.date).toLocaleDateString(
                                "en-IN"
                              )}
                            </td>
                            <td
                              className="p-3 font-mono text-xs text-blue-600"
                              rowSpan={voucher.entries.length}
                            >
                              {voucher.transactionCode || "-"}
                            </td>
                            <td
                              className="p-3 text-gray-800 font-medium"
                              rowSpan={voucher.entries.length}
                            >
                              {voucher.voucherNo}
                            </td>
                            <td
                              className="p-3"
                              rowSpan={voucher.entries.length}
                            >
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-bold border ${getVoucherTypeClasses(
                                  voucher.type
                                )}`}
                              >
                                {voucher.type}
                              </span>
                            </td>
                          </>
                        ) : null}

                        {/* --- Entry Specific Data --- */}
                        <td className="p-3 text-gray-600 max-w-xs truncate font-medium">
                          {/* If it's not the first entry, indent it slightly */}
                          {!isFirstRow && (
                            <ArrowRight
                              size={10}
                              className="inline mr-1 text-gray-400"
                            />
                          )}
                          {particulars}
                        </td>

                        <td className="p-3 text-right font-bold text-gray-800">
                          {formatMoney(debitAmount)}
                        </td>

                        <td className="p-3 text-right font-bold text-gray-800">
                          {formatMoney(creditAmount)}
                        </td>

                        {/* --- Action (Only on First Row) --- */}
                        {isFirstRow ? (
                          <td
                            className="p-3 text-center"
                            rowSpan={voucher.entries.length}
                          >
                            <Link
                              href={`/companies/${companyId}/vouchers/${voucher.id}/edit`}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                              title="View/Edit Voucher"
                            >
                              <FileEdit size={16} />
                            </Link>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                  {/* Optional: Add a narration row after all entries */}
                  {voucher.narration && (
                    <tr>
                      <td
                        colSpan={1}
                        className="p-1 border-r border-gray-200 bg-gray-50"
                      ></td>
                      <td
                        colSpan={7}
                        className="p-1 text-xs text-gray-500 italic bg-gray-50"
                      >
                        <span className="font-semibold text-gray-700 mr-1">
                          Narration:
                        </span>
                        {voucher.narration}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer/Summary */}
      {filteredVouchers.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-sm text-gray-600">
          Showing {filteredVouchers.length} of {vouchers.length} vouchers.
        </div>
      )}
    </div>
  );
}
