"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  FileEdit,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  Package,
  CheckSquare,
  Square,
  Loader2,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/voucher";
import { useRouter } from "next/navigation";

export default function VoucherTable({
  vouchers = [],
  companyId,
  isAdmin = false,
}: {
  vouchers: any[];
  companyId: number;
  isAdmin?: boolean;
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
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} vouchers?`
      )
    )
      return;

    const itemsToDelete = selectedIds.map((id) => {
      const v = vouchers.find((item) => item.id === id);
      return { id, type: v?.type || "" };
    });

    startTransition(async () => {
      // ✅ FIX: Removed 'companyId' argument. The action only takes the items array.
      const res = await deleteBulkVouchers(itemsToDelete);

      if (res.success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        alert("Error: " + (res.error || "Could not delete"));
      }
    });
  };

  const formatMoney = (amount: number | null) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
      Math.abs(amount || 0)
    );

  return (
    <div className="relative font-sans h-full flex flex-col">
      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="absolute top-2 left-4 right-4 z-50 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex justify-between items-center animate-in fade-in slide-in-from-top-2 shadow-2xl">
          <div className="flex items-center gap-3 text-white font-bold text-xs">
            <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-black">
              {selectedIds.length}
            </span>
            <span className="tracking-tight uppercase">Vouchers Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              <span>Delete Permanently</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* SEARCH HEADER */}
      <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between shrink-0 rounded-t-2xl">
        <div className="relative group w-full max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Search ID or Voucher No..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
            <ShieldCheck size={12} className="text-indigo-600" />
            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tighter">
              Admin View Active
            </span>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white border-x border-b border-slate-200 shadow-sm rounded-b-2xl flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 w-12 text-center border-b border-slate-200">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {filteredVouchers.length > 0 &&
                    selectedIds.length === filteredVouchers.length ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-slate-200 w-32">
                  Date
                </th>
                <th className="px-4 py-3 border-b border-slate-200 w-32">
                  Ref Info
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-center w-32">
                  Status
                </th>
                <th className="px-6 py-3 border-b border-slate-200">
                  Particulars
                </th>
                <th className="px-6 py-3 border-b border-slate-200 text-right w-32">
                  Debit (Dr)
                </th>
                <th className="px-6 py-3 border-b border-slate-200 text-right w-32">
                  Credit (Cr)
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-center w-16">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <FileText size={48} className="text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">
                        No vouchers found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher: any) => {
                  const isApproved = voucher.status === "APPROVED";
                  const isSelected = selectedIds.includes(voucher.id);
                  const isStockJournal = voucher.type === "STOCK_JOURNAL";

                  // Ensure entries exists even if empty
                  const entries = voucher.entries || [];
                  const rowsToRender = isStockJournal
                    ? [{ id: `sj-${voucher.id}`, isSJ: true }]
                    : entries;

                  // Admin Auto-Verify check
                  const isAutoVerified =
                    isApproved && voucher.verifiedBy?.role === "ADMIN";

                  return (
                    <React.Fragment key={voucher.id}>
                      {rowsToRender.map((row: any, index: number) => (
                        <tr
                          key={row.id || index}
                          className={`group transition-colors ${
                            isSelected
                              ? "bg-indigo-50/60"
                              : !isApproved
                              ? "bg-amber-50/30"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {index === 0 && (
                            <>
                              <td
                                className="px-4 py-3 text-center align-top border-r border-slate-50"
                                rowSpan={rowsToRender.length}
                              >
                                <button
                                  onClick={() => toggleSelectOne(voucher.id)}
                                  className="text-slate-300 hover:text-indigo-600 transition-colors mt-1"
                                >
                                  {isSelected ? (
                                    <CheckSquare
                                      size={16}
                                      className="text-indigo-600"
                                    />
                                  ) : (
                                    <Square size={16} />
                                  )}
                                </button>
                              </td>
                              <td
                                className="px-4 py-3 align-top whitespace-nowrap"
                                rowSpan={rowsToRender.length}
                              >
                                <div className="text-xs font-black text-slate-700">
                                  {new Date(voucher.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                    }
                                  )}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">
                                  {new Date(voucher.date).toLocaleDateString(
                                    "en-IN",
                                    { weekday: "long" }
                                  )}
                                </div>
                              </td>
                              <td
                                className="px-4 py-3 align-top"
                                rowSpan={rowsToRender.length}
                              >
                                <div className="font-mono text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mb-1">
                                  {voucher.transactionCode || "-"}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  #{voucher.voucherNo}
                                </div>
                              </td>
                              <td
                                className="px-4 py-3 text-center align-top"
                                rowSpan={rowsToRender.length}
                              >
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase border shadow-sm ${
                                    isAutoVerified
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                      : !isApproved
                                      ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  }`}
                                >
                                  {isAutoVerified ? (
                                    <ShieldCheck size={10} />
                                  ) : !isApproved ? (
                                    <Clock size={10} />
                                  ) : (
                                    <CheckCircle2 size={10} />
                                  )}
                                  {isAutoVerified
                                    ? "Auto-Verified"
                                    : voucher.status || "APPROVED"}
                                </div>
                              </td>
                            </>
                          )}

                          <td className="px-6 py-2 border-l border-slate-50">
                            {isStockJournal ? (
                              <div className="flex items-center gap-2 font-bold text-[10px] uppercase text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 w-fit">
                                <Package size={12} /> Stock Journal
                              </div>
                            ) : (
                              <div
                                className={`text-xs font-bold text-slate-700 flex items-center ${
                                  index > 0
                                    ? "pl-6 text-slate-500 font-medium"
                                    : ""
                                }`}
                              >
                                {index > 0 && (
                                  <Zap
                                    size={10}
                                    className="mr-2 text-slate-300"
                                  />
                                )}
                                {row.ledger?.name || (
                                  <span className="text-slate-400 italic">
                                    Unknown Ledger
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-2 text-right font-mono font-bold text-[10px] text-emerald-700">
                            {!isStockJournal && row.amount > 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>
                          <td className="px-6 py-2 text-right font-mono font-bold text-[10px] text-rose-700">
                            {!isStockJournal && row.amount < 0
                              ? formatMoney(row.amount)
                              : ""}
                          </td>

                          {index === 0 && (
                            <td
                              className="px-4 py-3 text-center border-l border-slate-50 align-top"
                              rowSpan={rowsToRender.length}
                            >
                              <Link
                                href={`/companies/${companyId}/vouchers/${voucher.type.toLowerCase()}/${
                                  voucher.id
                                }/edit`}
                                className="inline-flex p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <FileEdit size={14} />
                              </Link>
                            </td>
                          )}
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={8} className="h-px bg-slate-100"></td>
                      </tr>
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
