"use client";

import { deleteBulkStockItems, deleteStockItem } from "@/app/actions/masters";
import { Edit, Trash2, CheckSquare, Square } from "lucide-react";
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
    if (!confirm(`Delete ${selectedIds.length} items?`)) return;
    startTransition(async () => {
      await deleteBulkStockItems(selectedIds);
      setSelectedIds([]);
      router.refresh();
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this item?")) {
      startTransition(async () => {
        await deleteStockItem(id);
      });
    }
  };

  return (
    <div className="mt-2">
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 px-4 py-2 mb-2 rounded-lg border border-blue-100 flex justify-between items-center text-xs font-bold text-blue-800 animate-in fade-in">
          <span>{selectedIds.length} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest border-b">
            <tr>
              <th className="py-2 px-4 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-blue-600"
                >
                  {items.length > 0 && selectedIds.length === items.length ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </th>
              <th className="py-2 px-4">Item Name</th>
              <th className="py-2 px-4">Group</th>
              <th className="py-2 px-4 text-right">Opening Qty</th>
              <th className="py-2 px-4 text-right w-20">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-slate-400 font-bold uppercase italic"
                >
                  No stock items found
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/companies/${companyId}/inventory/${item.id}`
                      )
                    } // ✅ Row Click Navigation
                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Prevent row click
                          toggleSelect(item.id);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare size={14} className="text-blue-600" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    </td>
                    <td className="py-2 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </td>
                    <td className="py-2 px-4 text-[10px] uppercase font-bold text-slate-500">
                      {item.group?.name || "-"}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900">
                      {Number(item.quantity || 0)}{" "}
                      <span className="text-[9px] text-slate-400 ml-1">
                        {item.unit?.symbol}
                      </span>
                    </td>
                    <td className="py-2 px-4 flex justify-end gap-2">
                      <Link
                        href={`/companies/${companyId}/inventory/${item.id}/edit`}
                        onClick={(e) => e.stopPropagation()} // ✅ Prevent row click
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Prevent row click
                          handleDelete(item.id);
                        }}
                        disabled={isPending}
                        className="text-slate-300 hover:text-red-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
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
