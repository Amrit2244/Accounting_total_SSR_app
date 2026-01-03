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
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  Edit3,
  ShieldCheck, // New Icon for Admin status
} from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/voucher"; // Updated to match your path
import { useRouter } from "next/navigation";

export default function VoucherListClient({
  vouchers,
  companyId,
  baseUrl,
  isAdmin, // Added isAdmin prop
}: {
  vouchers: any[];
  companyId: number;
  baseUrl: string;
  isAdmin?: boolean; // Optional prop
}) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<
    { id: number; type: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const toggleSelectAll = () => {
    if (selectedItems.length === vouchers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(vouchers.map((v) => ({ id: v.id, type: v.type })));
    }
  };

  const toggleSelectOne = (id: number, type: string) => {
    const exists = selectedItems.find((i) => i.id === id && i.type === type);
    if (exists) {
      setSelectedItems(
        selectedItems.filter((i) => !(i.id === id && i.type === type))
      );
    } else {
      setSelectedItems([...selectedItems, { id, type }]);
    }
  };

  const isSelected = (id: number, type: string) =>
    selectedItems.some((i) => i.id === id && i.type === type);

  const handleBulkDelete = () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedItems.length} vouchers? This action cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteBulkVouchers(selectedItems, companyId);
      if (result.success) {
        setSelectedItems([]);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete.");
      }
    });
  };

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative mt-2">
      {/* BULK ACTION TOOLBAR */}
      {selectedItems.length > 0 && (
        <div className="absolute top-2 left-4 right-4 z-30 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-white font-bold text-xs">
            <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-black">
              {selectedItems.length}
            </span>
            <span className="tracking-tight">Vouchers Selected for Action</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              <span>Delete Permanently</span>
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md shadow-sm">
            <tr>
              <th className="px-4 py-4 w-12 text-center border-b border-slate-200">
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
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Date
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Voucher ID
              </th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                Particulars (Debit/Credit)
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">
                Amount
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-24 text-center text-slate-400 font-bold"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="opacity-20" />
                    <span className="text-sm tracking-tight">
                      No Transactions Recorded
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              vouchers.map((v) => {
                const selected = isSelected(v.id, v.type);
                const isApproved = v.status === "APPROVED";

                return (
                  <tr
                    key={`${v.type}-${v.id}`}
                    className={`group transition-all duration-200 ${
                      selected ? "bg-indigo-50/40" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleSelectOne(v.id, v.type)}
                        className="text-slate-300 hover:text-indigo-400 transition-colors"
                      >
                        {selected ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-700">
                        {format(new Date(v.date), "dd MMM yyyy")}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {format(new Date(v.date), "EEEE")}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                          {v.transactionCode || "NO-ID"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 ml-0.5 uppercase tracking-widest">
                          #{v.voucherNo}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-black text-[9px] uppercase border shadow-sm ${
                          v.type === "SALES"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : v.type === "PURCHASE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : v.type === "PAYMENT"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : v.type === "RECEIPT"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {v.type}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[11px] leading-tight">
                        <div className="flex items-center gap-2 group/particulars">
                          <span className="font-black text-slate-300 text-[8px] uppercase w-4">
                            Dr
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[240px]">
                            {v.drLabel || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-300 text-[8px] uppercase w-4">
                            Cr
                          </span>
                          <span className="font-bold text-slate-500 truncate max-w-[240px]">
                            {v.crLabel || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-mono font-black text-xs text-slate-900">
                      ₹
                      {(v.totalAmount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border shadow-sm ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                          }`}
                        >
                          {isApproved ? (
                            // Show Shield icon for Admin auto-verified, otherwise Checkmark
                            isAdmin ? (
                              <ShieldCheck
                                size={8}
                                className="text-indigo-600"
                              />
                            ) : (
                              <CheckCircle2 size={8} />
                            )
                          ) : (
                            <AlertCircle size={8} />
                          )}
                          {isApproved && isAdmin ? "Auto-Verified" : v.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT BUTTON */}
                        <Link
                          href={`${baseUrl}/${v.type.toLowerCase()}/${
                            v.id
                          }/edit`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                        >
                          <Edit3 size={10} />
                          Edit
                        </Link>

                        {/* DETAILS BUTTON */}
                        <Link
                          href={`${baseUrl}/${v.type.toLowerCase()}/${v.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200"
                        >
                          <Eye size={10} />
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Vouchers Found: {vouchers.length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Selected: {selectedItems.length}
          </span>
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-indigo-500">
              <ShieldCheck size={10} />
              Admin Privilege Enabled
            </span>
          )}
        </div>
        <span>Accounting Cloud System • v1.2.0</span>
      </div>
    </div>
  );
}
