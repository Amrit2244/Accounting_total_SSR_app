"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/masters";
import { useRouter } from "next/navigation";

export default function VoucherListClient({
  vouchers,
  companyId,
  baseUrl,
}: {
  vouchers: any[];
  companyId: number;
  baseUrl: string;
}) {
  const router = useRouter();
  // We store { id, type } so the server knows WHERE to delete from
  const [selectedItems, setSelectedItems] = useState<
    { id: number; type: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedItems.length === vouchers.length) {
      setSelectedItems([]); // Deselect All
    } else {
      // Select All: Map every voucher to { id, type }
      setSelectedItems(vouchers.map((v) => ({ id: v.id, type: v.type })));
    }
  };

  const toggleSelectOne = (id: number, type: string) => {
    const exists = selectedItems.find((i) => i.id === id && i.type === type);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== id));
    } else {
      setSelectedItems([...selectedItems, { id, type }]);
    }
  };

  const isSelected = (id: number) => selectedItems.some((i) => i.id === id);

  // --- DELETE LOGIC ---
  const handleBulkDelete = () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedItems.length} vouchers?`
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteBulkVouchers(selectedItems, companyId);
      if (result.success) {
        setSelectedItems([]); // Clear selection
        router.refresh(); // Refresh list
      } else {
        alert(result.message || "Failed to delete.");
      }
    });
  };

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative mt-2">
      {/* BULK ACTION BAR (Floating) */}
      {selectedItems.length > 0 && (
        <div className="absolute top-2 left-4 right-4 z-30 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg shadow-indigo-100/50">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
            <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-[10px]">
              {selectedItems.length}
            </span>
            <span>Items Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
            <tr>
              {/* CHECKBOX HEADER */}
              <th className="px-4 py-3 w-12 text-center border-b border-slate-200">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {vouchers.length > 0 &&
                  selectedItems.length === vouchers.length ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-32">
                Date
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-32">
                Type
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-32">
                Ref Info
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Particulars
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right w-32">
                Amount
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center w-24">
                Status
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right w-24">
                View
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center opacity-50 mb-4 text-slate-400">
                    <FileText size={48} className="mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">
                      No vouchers found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your filters or date range.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              vouchers.map((v) => {
                const selected = isSelected(v.id);

                // Helper: Determine displayed ledgers
                let debitLedger = "—";
                let creditLedger = "—";

                if (v.entries && v.entries.length > 0) {
                  const dr = v.entries.find((e: any) => e.amount > 0);
                  const cr = v.entries.find((e: any) => e.amount < 0);
                  if (dr?.ledger) debitLedger = dr.ledger.name;
                  if (cr?.ledger) creditLedger = cr.ledger.name;
                } else if (v.partyName) {
                  if (v.type === "SALES") {
                    debitLedger = v.partyName;
                    creditLedger = "Sales Account";
                  } else if (v.type === "PURCHASE") {
                    debitLedger = "Purchase Account";
                    creditLedger = v.partyName;
                  }
                }

                return (
                  <tr
                    key={`${v.type}-${v.id}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a, button"))
                        return;
                      toggleSelectOne(v.id, v.type);
                    }}
                    className={`group cursor-pointer transition-colors ${
                      selected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* CHECKBOX CELL */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(v.id, v.type);
                        }}
                        className="text-slate-300 hover:text-indigo-600 transition-colors"
                      >
                        {selected ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>

                    {/* DATA CELLS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-700">
                        {format(new Date(v.date), "dd MMM yyyy")}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">
                        {format(new Date(v.date), "EEEE")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border ${
                          v.type === "SALES"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : v.type === "PURCHASE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : v.type === "PAYMENT"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : v.type === "RECEIPT"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {v.type === "SALES" && <ArrowUpRight size={10} />}
                        {v.type === "PURCHASE" && <ArrowDownLeft size={10} />}
                        {v.type === "CONTRA" && <ArrowRightLeft size={10} />}
                        {v.type.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                        {v.transactionCode || "N/A"}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        #{v.voucherNo}
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300 w-3">
                            Dr
                          </span>
                          <span className="font-bold text-slate-700 truncate max-w-[180px]">
                            {debitLedger}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300 w-3">
                            Cr
                          </span>
                          <span className="font-medium text-slate-500 truncate max-w-[180px]">
                            {creditLedger}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3 text-right font-mono font-black text-xs text-slate-800">
                      ₹
                      {(v.totalAmount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          v.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : v.status === "REJECTED"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`${baseUrl}/${v.type.toLowerCase()}/${v.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-2.5 flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
        <span>Records Found: {vouchers.length}</span>
        <span>Accounting Year 2025-2026</span>
      </div>
    </div>
  );
}
