"use client";

import { deleteBulkStockItems, deleteStockItem } from "@/app/actions/masters";
import {
  Edit,
  Trash2,
  CheckSquare,
  Square,
  Package,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function InventoryTable({
  items,
  companyId,
}: {
  items: any[];
  companyId: number;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === items.length ? [] : items.map((item) => item.id)
    );
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      await deleteBulkStockItems(selectedIds);
      setSelectedIds([]);
      router.refresh();
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to permanently delete this item?")) {
      startTransition(async () => {
        await deleteStockItem(id);
      });
    }
  };

  const getUnitLabel = (item: any) => {
    if (item.unit) {
      if (typeof item.unit === "string") return item.unit;
      if (typeof item.unit === "object")
        return item.unit.symbol || item.unit.name || "";
    }
    if (item.stockItem?.unit) {
      if (typeof item.stockItem.unit === "string") return item.stockItem.unit;
      if (typeof item.stockItem.unit === "object")
        return item.stockItem.unit.symbol || "";
    }
    return "";
  };

  return (
    <div className="mt-4 relative">
      {selectedIds.length > 0 && (
        <div className="absolute -top-12 left-0 right-0 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex justify-between items-center z-20 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
            <span className="bg-indigo-200 px-2 py-0.5 rounded text-[10px]">
              {selectedIds.length}
            </span>
            <span>Items Selected</span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition-colors shadow-sm"
          >
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {items.length > 0 && selectedIds.length === items.length ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Item Name
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Category Group
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                Rate
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                Current Stock
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <Package size={48} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      No inventory items found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Get started by creating a new stock item.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                let displayRate = "0.00";
                const qty = Number(item.quantity) || 0;
                const amt = Number(item.amount) || 0;
                const rate = Number(item.rate) || 0;

                if (rate > 0) {
                  displayRate = rate.toFixed(2);
                } else if (qty > 0 && amt > 0) {
                  displayRate = (amt / qty).toFixed(2);
                }

                const unitLabel = getUnitLabel(item);

                return (
                  <tr
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/companies/${companyId}/inventory/${item.id}`
                      )
                    }
                    className={`group transition-colors cursor-pointer ${
                      isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="text-slate-300 hover:text-indigo-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {item.name || item.stockItem?.name}
                      </div>
                      {item.partNumber && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          SKU: {item.partNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        <Archive size={10} />
                        {item.group?.name ||
                          item.stockItem?.group?.name ||
                          "General"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {/* Force Indian Locale for Rate */}
                        {Number(displayRate).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[9px] text-slate-400 ml-1">
                        /{unitLabel || "Unit"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {/* FIX: Force 'en-IN' locale to prevent hydration mismatch */}
                      <span className="font-mono font-bold text-sm text-slate-700">
                        {Number(item.quantity || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">
                        {unitLabel}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/companies/${companyId}/inventory/${item.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Item"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
