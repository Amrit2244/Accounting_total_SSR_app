"use client";

import React, { useState, useMemo, useTransition } from "react";
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
import { deleteBulkVouchers } from "@/app/actions/voucher";
import { useRouter } from "next/navigation";

export default function VoucherTable({
  vouchers = [],
  companyId,
}: {
  vouchers: any[];
  companyId: number;
}) {
  const [searchId, setSearchId] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  const filteredVouchers = useMemo(() => {
    if (!searchId.trim()) return vouchers;
    return vouchers.filter(
      (v: any) =>
        v.transactionCode?.toLowerCase().includes(searchId.toLowerCase()) ||
        v.voucherNo?.toString().toLowerCase().includes(searchId.toLowerCase())
    );
  }, [vouchers, searchId]);

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.length === filteredVouchers.length
        ? []
        : filteredVouchers.map((v: any) => v.id)
    );

  const toggleSelectOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} vouchers permanently?`)) return;

    const itemsToDelete = selectedIds.map((id) => {
      const v = vouchers.find((item) => item.id === id);
      return { id, type: v?.type || "" };
    });

    startTransition(async () => {
      const res = await deleteBulkVouchers(itemsToDelete, companyId);
      if (res.success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        // ✅ Safe Access to Message
        const msg = res.message || (res as any).error || "Could not delete";
        alert("Error: " + msg);
      }
    });
  };

  const formatMoney = (amount: number | null) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
      Math.abs(amount || 0)
    );

  return (
    <div className="relative font-sans">
      {/* ... (Rest of your JSX remains exactly the same) ... */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2">
          <span className="text-[10px] font-black uppercase tracking-widest">
            {selectedIds.length} Selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-red-400 hover:text-white font-bold text-[10px] uppercase transition-colors"
          >
            <Trash2 size={12} /> {isDeleting ? "..." : "Delete"}
          </button>
          <button onClick={() => setSelectedIds([])}>
            <X size={14} className="text-slate-500 hover:text-white" />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="relative w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search ID or Vch No..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full text-[11px] font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all uppercase placeholder:normal-case"
            />
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {filteredVouchers.length} Entries
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="accent-blue-600 cursor-pointer"
                    checked={
                      selectedIds.length === filteredVouchers.length &&
                      filteredVouchers.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">ID</th>
                <th className="p-3">Vch No</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Particulars</th>
                <th className="p-3 text-right">Debit (₹)</th>
                <th className="p-3 text-right">Credit (₹)</th>
                <th className="p-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-slate-400 italic text-xs font-bold uppercase"
                  >
                    No vouchers found
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher: any) => {
                  const isPending = voucher.status === "PENDING";
                  const isSelected = selectedIds.includes(voucher.id);
                  const isStockJournal = voucher.type === "STOCK_JOURNAL";
                  const rowsToRender = isStockJournal
                    ? [{ id: `sj-${voucher.id}`, isSJ: true }]
                    : voucher.entries;

                  return (
                    <React.Fragment key={voucher.id}>
                      {rowsToRender.map((row: any, index: number) => (
                        <tr
                          key={row.id}
                          className={`group transition-colors ${
                            isSelected
                              ? "bg-blue-50/60"
                              : isPending
                              ? "bg-red-50/30"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {index === 0 && (
                            <>
                              <td
                                className="p-3 text-center border-r border-slate-50 align-top"
                                rowSpan={rowsToRender.length}
                              >
                                <input
                                  type="checkbox"
                                  className="accent-blue-600 cursor-pointer"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(voucher.id)}
                                />
                              </td>
                              <td
                                className="p-3 font-bold align-top"
                                rowSpan={rowsToRender.length}
                              >
                                {new Date(voucher.date).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" }
                                )}
                              </td>
                              <td
                                className="p-3 font-mono text-[10px] text-blue-600 align-top"
                                rowSpan={rowsToRender.length}
                              >
                                {voucher.transactionCode || "-"}
                              </td>
                              <td
                                className="p-3 font-black text-slate-900 uppercase align-top"
                                rowSpan={rowsToRender.length}
                              >
                                {voucher.voucherNo}
                              </td>
                              <td
                                className="p-3 text-center align-top"
                                rowSpan={rowsToRender.length}
                              >
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                                    isPending
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
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
                          <td
                            className={`p-3 border-l border-slate-50 ${
                              isPending ? "text-red-700" : "text-slate-600"
                            }`}
                          >
                            {isStockJournal ? (
                              <div className="flex items-center gap-1 font-bold text-[10px] uppercase text-blue-600">
                                <Package size={12} /> Stock Journal
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase font-bold">
                                {index > 0 && (
                                  <ArrowRight
                                    size={10}
                                    className="inline mr-1 text-slate-300"
                                  />
                                )}{" "}
                                {row.ledger?.name || "Unknown"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[10px]">
                            {!isStockJournal && row.amount > 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[10px]">
                            {!isStockJournal && row.amount < 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>
                          {index === 0 && (
                            <td
                              className="p-3 text-center border-l border-slate-50 align-top"
                              rowSpan={rowsToRender.length}
                            >
                              <Link
                                href={`/companies/${companyId}/vouchers/${voucher.type}/${voucher.id}/edit`}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1 inline-block"
                              >
                                <FileEdit size={14} />
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
