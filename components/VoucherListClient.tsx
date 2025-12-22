"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Trash2, Loader2, CheckSquare, Square } from "lucide-react";
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
        `Are you sure you want to delete ${selectedItems.length} vouchers? This cannot be undone.`
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
    <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col relative">
      {/* BULK ACTION BAR */}
      {selectedItems.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-rose-50 border-b border-rose-100 p-2 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs px-4">
            <CheckSquare size={16} />
            {selectedItems.length} Selected
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete Selected
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              {/* CHECKBOX HEADER */}
              <th className="px-4 py-4 w-10 bg-slate-900 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="hover:text-blue-400"
                >
                  {vouchers.length > 0 &&
                  selectedItems.length === vouchers.length ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="px-4 py-4 w-32 bg-slate-900">Date</th>
              <th className="px-4 py-4 w-24 bg-slate-900">Type</th>
              <th className="px-4 py-4 w-32 bg-slate-900">TXID / Vch No</th>
              <th className="px-6 py-4 bg-slate-900">Particulars</th>
              <th className="px-6 py-4 text-right w-32 bg-slate-900">Amount</th>
              <th className="px-6 py-4 text-center w-24 bg-slate-900">
                Status
              </th>
              <th className="px-6 py-4 text-right w-24 bg-slate-900">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center opacity-40 mb-4 text-slate-400">
                    <FileText size={48} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      No Records Found
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
                      // Prevent selecting when clicking View button
                      if ((e.target as HTMLElement).closest("a, button"))
                        return;
                      toggleSelectOne(v.id, v.type);
                    }}
                    className={`group text-slate-700 cursor-pointer transition-colors ${
                      selected ? "bg-blue-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* CHECKBOX CELL */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(v.id, v.type);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {selected ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>

                    {/* DATA CELLS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900">
                        {format(new Date(v.date), "dd MMM yyyy")}
                      </div>
                      <div className="text-[8px] text-slate-400 font-black uppercase">
                        {format(new Date(v.date), "EEEE")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
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
                        {v.type.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[10px] font-mono text-slate-500">
                      TX:{" "}
                      <span className="font-bold text-slate-900">
                        {v.transactionCode || "N/A"}
                      </span>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                        #{v.voucherNo}
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300 w-4">
                            Dr
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[200px]">
                            {debitLedger}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300 w-4">
                            Cr
                          </span>
                          <span className="font-medium text-slate-600 truncate max-w-[200px]">
                            {creditLedger}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3 text-right font-mono font-black text-slate-900 text-xs">
                      ₹
                      {(v.totalAmount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                          v.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-100"
                            : v.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700 border-rose-100"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`${baseUrl}/${v.type.toLowerCase()}/${v.id}`}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter underline underline-offset-4 decoration-blue-200"
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

      <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
        <span>Records Found: {vouchers.length}</span>
        <span>
          {selectedItems.length > 0
            ? `${selectedItems.length} Selected`
            : "Accounting Daybook System"}
        </span>
      </div>
    </div>
  );
}
