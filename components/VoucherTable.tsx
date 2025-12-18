"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  FileEdit,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  Package,
} from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/masters";

export default function VoucherTable({
  vouchers = [],
  companyId,
}: {
  vouchers: any[];
  companyId: number;
}) {
  const [searchId, setSearchId] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredVouchers = useMemo(() => {
    if (!searchId.trim()) return vouchers;
    return vouchers.filter(
      (v: any) =>
        v.transactionCode?.toLowerCase().includes(searchId.toLowerCase()) ||
        v.voucherNo?.toLowerCase().includes(searchId.toLowerCase())
    );
  }, [vouchers, searchId]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredVouchers.length) setSelectedIds([]);
    else setSelectedIds(filteredVouchers.map((v: any) => v.id));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} vouchers permanently?`)) return;
    setIsDeleting(true);
    const res = await deleteBulkVouchers(selectedIds, companyId);
    if (res.success) setSelectedIds([]);
    else alert("Error: " + (res.message || "Could not delete"));
    setIsDeleting(false);
  };

  const formatMoney = (amount: number | null) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
      Math.abs(amount || 0)
    );

  return (
    <div className="relative">
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium">Vouchers Selected</span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold text-sm disabled:opacity-50"
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 size={18} /> Delete Selected
              </>
            )}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1 hover:bg-slate-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by ID or Voucher No..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Daybook entries
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="bg-slate-800 text-slate-200 font-bold uppercase text-[10px] tracking-widest sticky top-0">
              <tr>
                <th className="p-4 border-b w-10 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-blue-600"
                    checked={
                      selectedIds.length === filteredVouchers.length &&
                      filteredVouchers.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b">Trans ID</th>
                <th className="p-4 border-b">Vch No</th>
                <th className="p-4 border-b text-center">Status</th>
                <th className="p-4 border-b">Ledger Particulars</th>
                <th className="p-4 border-b text-right">Debit (₹)</th>
                <th className="p-4 border-b text-right">Credit (₹)</th>
                <th className="p-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-20 text-center text-slate-400 italic"
                  >
                    No vouchers found.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher: any) => {
                  const isPending = voucher.status === "PENDING";
                  const isSelected = selectedIds.includes(voucher.id);
                  const isStockJournal = voucher.type === "STOCK_JOURNAL";

                  // Logic to handle row display for Stock Journals (which have no entries)
                  const rowsToRender = isStockJournal
                    ? [{ id: `sj-${voucher.id}`, isSJ: true }]
                    : voucher.entries;

                  return (
                    <React.Fragment key={voucher.id}>
                      {rowsToRender.map((row: any, index: number) => (
                        <tr
                          key={row.id}
                          className={`transition-all ${
                            isSelected
                              ? "bg-blue-50"
                              : isPending
                              ? "bg-red-50/40"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          {index === 0 && (
                            <>
                              <td
                                className="p-4 text-center border-r border-slate-50"
                                rowSpan={rowsToRender.length}
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded accent-blue-600"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(voucher.id)}
                                />
                              </td>
                              <td
                                className="p-4 font-bold text-slate-700"
                                rowSpan={rowsToRender.length}
                              >
                                {new Date(voucher.date).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" }
                                )}
                              </td>
                              <td
                                className="p-4 font-mono text-xs text-blue-600"
                                rowSpan={rowsToRender.length}
                              >
                                {voucher.transactionCode || "-"}
                              </td>
                              <td
                                className="p-4 font-black text-slate-900 uppercase"
                                rowSpan={rowsToRender.length}
                              >
                                {voucher.voucherNo}
                              </td>
                              <td
                                className="p-4 text-center"
                                rowSpan={rowsToRender.length}
                              >
                                <div
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                    isPending
                                      ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  {isPending ? (
                                    <Clock size={10} />
                                  ) : (
                                    <CheckCircle2 size={10} />
                                  )}{" "}
                                  {voucher.status || "APPROVED"}
                                </div>
                              </td>
                            </>
                          )}

                          {/* Particulars Logic */}
                          <td
                            className={`p-4 font-medium border-l border-slate-50 ${
                              isPending ? "text-red-700" : "text-slate-600"
                            }`}
                          >
                            {isStockJournal ? (
                              <div className="flex items-center gap-2">
                                <Package size={14} className="text-blue-500" />
                                <span className="font-bold">
                                  Stock Journal / Manufacturing
                                </span>
                              </div>
                            ) : (
                              <>
                                {index > 0 && (
                                  <ArrowRight
                                    size={10}
                                    className="inline mr-2 text-slate-300"
                                  />
                                )}
                                {row.ledger?.name || "Unknown Ledger"}
                              </>
                            )}
                          </td>

                          {/* Amount Logic */}
                          <td
                            className={`p-4 text-right font-mono font-bold ${
                              isPending ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {isStockJournal
                              ? "-"
                              : row.amount > 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>
                          <td
                            className={`p-4 text-right font-mono font-bold ${
                              isPending ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {isStockJournal
                              ? formatMoney(voucher.totalAmount)
                              : row.amount < 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>

                          {index === 0 && (
                            <td
                              className="p-4 text-center border-l border-slate-50"
                              rowSpan={rowsToRender.length}
                            >
                              <Link
                                href={`/companies/${companyId}/vouchers/${voucher.id}/edit`}
                                className="p-2 inline-block rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                              >
                                <FileEdit size={16} />
                              </Link>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
