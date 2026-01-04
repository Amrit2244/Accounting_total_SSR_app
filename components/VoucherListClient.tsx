"use client";

import { useState, useTransition, useEffect } from "react";
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
  Edit3,
  ShieldCheck,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock, // New icon for Pending status
} from "lucide-react";
import { deleteBulkVouchers } from "@/app/actions/voucher";
import { useRouter } from "next/navigation";

export default function VoucherListClient({
  vouchers,
  companyId,
  baseUrl,
  isAdmin,
}: {
  vouchers: any[];
  companyId: number;
  baseUrl: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<
    { id: number; type: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  // --- TALLY MODE STATE ---
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const visibleVouchers = vouchers.filter((v) => !hiddenIds.includes(v.id));
  const totalDebit = visibleVouchers.reduce(
    (sum, v) => sum + (v.totalAmount || 0),
    0
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === visibleVouchers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        visibleVouchers.map((v) => ({ id: v.id, type: v.type }))
      );
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

  const checkIsSelected = (id: number, type: string) =>
    selectedItems.some((i) => i.id === id && i.type === type);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.code === "KeyR" || e.key === "r")) {
        e.preventDefault();
        if (highlightedId && !hiddenIds.includes(highlightedId)) {
          setHiddenIds((prev) => [...prev, highlightedId]);
          const currentIndex = visibleVouchers.findIndex(
            (v) => v.id === highlightedId
          );
          if (currentIndex < visibleVouchers.length - 1) {
            setHighlightedId(visibleVouchers[currentIndex + 1].id);
          } else if (currentIndex > 0) {
            setHighlightedId(visibleVouchers[currentIndex - 1].id);
          } else {
            setHighlightedId(null);
          }
        }
      }
      if (e.altKey && (e.code === "KeyU" || e.key === "u")) {
        e.preventDefault();
        setHiddenIds((prev) => {
          const newHidden = [...prev];
          newHidden.pop();
          return newHidden;
        });
      }
      if (e.code === "Space" && highlightedId) {
        e.preventDefault();
        const v = visibleVouchers.find((v) => v.id === highlightedId);
        if (v) toggleSelectOne(v.id, v.type);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedId, hiddenIds, visibleVouchers, selectedItems]);

  const handleBulkDelete = () => {
    if (!confirm(`Permanently delete ${selectedItems.length} vouchers?`))
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
    <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative mt-2">
      {/* BULK ACTION BAR */}
      {selectedItems.length > 0 && (
        <div className="absolute top-2 left-4 right-4 z-30 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-white font-bold text-xs">
            <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-black">
              {selectedItems.length}
            </span>
            <span>Vouchers Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase hover:bg-rose-500 transition-colors flex items-center gap-1"
            >
              {isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Trash2 size={10} />
              )}{" "}
              Delete
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TABLE HEADER - 12 Columns Total */}
      <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 py-1.5 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-20">
        <div className="col-span-1 text-center">
          <button onClick={toggleSelectAll}>
            {selectedItems.length === visibleVouchers.length &&
            visibleVouchers.length > 0 ? (
              <CheckSquare size={14} className="text-indigo-600" />
            ) : (
              <Square size={14} />
            )}
          </button>
        </div>
        <div className="col-span-1">Date</div>
        <div className="col-span-1">Vch No</div>
        <div className="col-span-1">TXID</div>
        <div className="col-span-3 pl-2">Particulars</div>
        <div className="col-span-1 text-center">Type</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1 text-center">Action</div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {visibleVouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <FileText size={32} className="opacity-20 mb-2" />
            <span className="text-xs font-bold">No Transactions Found</span>
          </div>
        ) : (
          visibleVouchers.map((v) => {
            const selected = checkIsSelected(v.id, v.type);
            const isHighlighted = highlightedId === v.id;
            const isApproved = v.status === "APPROVED";

            return (
              <div
                key={`${v.type}-${v.id}`}
                onClick={() => setHighlightedId(v.id)}
                onDoubleClick={() =>
                  router.push(`${baseUrl}/${v.type.toLowerCase()}/${v.id}`)
                }
                className={`grid grid-cols-12 py-1 px-2 border-b border-slate-100 text-xs items-center cursor-pointer transition-colors select-none
                  ${
                    isHighlighted
                      ? "bg-blue-100 text-blue-900 border-blue-200"
                      : "hover:bg-slate-50 text-slate-800"
                  }
                  ${selected ? "bg-indigo-50/50" : ""}
                `}
              >
                {/* Checkbox */}
                <div
                  className="col-span-1 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectOne(v.id, v.type);
                  }}
                >
                  {selected ? (
                    <CheckSquare
                      size={14}
                      className="text-indigo-600 mx-auto"
                    />
                  ) : (
                    <Square
                      size={14}
                      className="text-slate-300 mx-auto hover:text-indigo-400"
                    />
                  )}
                </div>

                <div className="col-span-1 font-medium opacity-80 text-[10px]">
                  {format(new Date(v.date), "dd-MM")}
                </div>

                <div className="col-span-1 font-mono text-[10px] opacity-70 font-bold">
                  #{v.voucherNo}
                </div>

                {/* TXID Column */}
                <div
                  className="col-span-1 font-mono text-[9px] text-slate-400 truncate"
                  title={v.transactionCode}
                >
                  {v.transactionCode || "-"}
                </div>

                <div className="col-span-3 pl-2 truncate font-bold uppercase flex flex-col justify-center">
                  <span>{v.displayParticulars}</span>
                  {isHighlighted && v.narration && (
                    <span className="text-[9px] font-normal italic opacity-60 text-slate-500 normal-case truncate block leading-tight">
                      ({v.narration})
                    </span>
                  )}
                </div>

                {/* Type Badge */}
                <div className="col-span-1 text-center">
                  <span
                    className={`text-[9px] font-black px-1 rounded border uppercase tracking-wider
                    ${
                      v.type === "SALES"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : v.type === "PURCHASE"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {v.type.substring(0, 3)}
                  </span>
                </div>

                {/* Status Column */}
                <div className="col-span-1 text-center">
                  {isApproved ? (
                    <div
                      className="flex items-center justify-center gap-1 text-emerald-600"
                      title="Approved"
                    >
                      <ShieldCheck size={12} />
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center gap-1 text-amber-500 animate-pulse"
                      title="Pending Verification"
                    >
                      <Clock size={12} />
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-right font-mono font-bold tracking-tight">
                  {v.totalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>

                <div
                  className="col-span-1 flex justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`${baseUrl}/${v.type.toLowerCase()}/${v.id}/edit`}
                    className="text-amber-500 hover:text-amber-700"
                  >
                    <Edit3 size={12} />
                  </Link>
                  <Link
                    href={`${baseUrl}/${v.type.toLowerCase()}/${v.id}`}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Eye size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        )}

        {/* Fill Empty Space */}
        {visibleVouchers.length < 15 &&
          Array.from({ length: 15 - visibleVouchers.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="grid grid-cols-12 py-2 border-b border-slate-50 opacity-0"
            >
              .
            </div>
          ))}
      </div>

      {/* FOOTER TOTALS */}
      <div className="bg-slate-50 border-t-2 border-slate-300 py-1.5 px-4 grid grid-cols-12 items-center shrink-0 text-[10px] font-bold uppercase text-slate-500">
        <div className="col-span-6 flex items-center gap-3">
          <span className="text-slate-800">
            Count: {visibleVouchers.length}
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          {hiddenIds.length > 0 && (
            <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2 rounded border border-amber-100">
              <EyeOff size={10} /> {hiddenIds.length} Hidden (Alt+U)
            </span>
          )}
          {selectedItems.length > 0 && (
            <span className="text-indigo-600 flex items-center gap-1">
              <CheckCircle2 size={10} /> {selectedItems.length} Selected
            </span>
          )}
        </div>

        <div className="col-span-3 text-right text-slate-900 font-black pr-2">
          Total Debit
        </div>

        <div className="col-span-2 text-right font-mono text-sm font-black text-slate-900">
          ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <div className="col-span-1"></div>
      </div>
    </div>
  );
}
