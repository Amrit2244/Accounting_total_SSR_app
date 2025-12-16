"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Eye, Printer, CheckSquare, Square } from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/delete-vouchers"; // ✅ IMPORT SERVER ACTION

type Voucher = {
  id: number;
  date: Date;
  voucherNo: string;
  transactionCode: string;
  type: string;
  narration: string | null;
  entries: {
    amount: number;
    ledger: { name: string };
  }[];
  inventory: any[];
  status: string;
};

export default function VoucherTable({
  vouchers,
  companyId,
}: {
  vouchers: Voucher[];
  companyId: number;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Single Row
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle All
  const toggleAll = () => {
    if (selectedIds.length === vouchers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vouchers.map((v) => v.id));
    }
  };

  // ✅ SERVER ACTION DELETE HANDLER
  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} vouchers?`
      )
    )
      return;

    setIsDeleting(true);

    // Call the Server Action directly (No API route needed)
    const res = await deleteBulkVouchers(selectedIds, companyId);

    if (res.error) {
      alert(res.error);
    } else {
      setSelectedIds([]); // Clear selection on success
    }

    setIsDeleting(false);
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
      {/* TOOLBAR (Only visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-2 flex justify-between items-center border-b border-red-100 px-4">
          <span className="text-red-800 text-xs font-bold">
            {selectedIds.length} Selected
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 uppercase"
          >
            {isDeleting ? (
              "Processing..."
            ) : (
              <>
                <Trash2 size={14} /> Delete Selected
              </>
            )}
          </button>
        </div>
      )}

      {/* TABLE */}
      <table className="w-full text-sm text-left">
        <thead className="bg-[#003366] text-white uppercase text-[10px] font-bold">
          <tr>
            <th
              className="p-3 w-10 text-center cursor-pointer"
              onClick={toggleAll}
            >
              {selectedIds.length === vouchers.length && vouchers.length > 0 ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} className="opacity-50" />
              )}
            </th>
            <th className="p-3">Trans ID</th>
            <th className="p-3">Date</th>
            <th className="p-3">Voucher No</th>
            <th className="p-3">Type</th>
            <th className="p-3">Party / Ledger</th>
            <th className="p-3 text-right">Amount</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {vouchers.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                No vouchers found.
              </td>
            </tr>
          ) : (
            vouchers.map((v) => {
              const isSelected = selectedIds.includes(v.id);
              // Find the primary Party (usually the first entry that isn't Sales/Purchase/Tax, or just the first one)
              const partyName = v.entries[0]?.ledger.name || "Unknown";
              const amount = v.entries.find((e) => e.amount > 0)?.amount || 0;

              return (
                <tr
                  key={v.id}
                  className={`hover:bg-blue-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleSelect(v.id)}
                      className="text-gray-400 hover:text-[#003366]"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[#003366]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-gray-500">
                    #{v.transactionCode}
                  </td>
                  <td className="p-3">
                    {new Date(v.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-bold">{v.voucherNo}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-300">
                      {v.type}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-[#003366]">{partyName}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₹ {amount.toFixed(2)}
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <Link
                      href={`/companies/${companyId}/vouchers/verify/${v.transactionCode}`}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View/Verify"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/companies/${companyId}/vouchers/${v.id}/print`}
                      target="_blank"
                      className="text-gray-600 hover:text-black p-1"
                      title="Print"
                    >
                      <Printer size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
