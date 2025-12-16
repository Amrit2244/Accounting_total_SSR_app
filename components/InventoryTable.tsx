"use client";

import { deleteBulkStockItems, deleteStockItem } from "@/app/actions/masters";
import { Edit, Trash2, CheckSquare, Square, X } from "lucide-react"; // Added Icons
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

  // Toggle Single Row Selection
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle All Rows
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]); // Uncheck all
    } else {
      setSelectedIds(items.map((item) => item.id)); // Check all
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected items?`
      )
    )
      return;

    startTransition(async () => {
      await deleteBulkStockItems(selectedIds);
      setSelectedIds([]); // Clear selection after delete
      router.refresh();
    });
  };

  // Handle Single Delete
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      startTransition(async () => {
        await deleteStockItem(id);
      });
    }
  };

  return (
    <div className="mt-4">
      {/* BULK ACTIONS HEADER (Only visible when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 p-2 mb-2 rounded border border-blue-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-semibold text-blue-800 ml-2">
            {selectedIds.length} items selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 font-bold flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              {/* CHECKBOX HEADER */}
              <th className="py-3 px-4 w-10">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center text-gray-500 hover:text-gray-700"
                >
                  {items.length > 0 && selectedIds.length === items.length ? (
                    <CheckSquare size={18} className="text-blue-600" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4">Group</th>
              <th className="py-3 px-4 text-right">Opening Qty</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No stock items found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                // CLEAN QUANTITY LOGIC: Convert to number to remove leading zeros or nulls
                const qty = Number(item.quantity || 0);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {/* CHECKBOX ROW */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="flex items-center text-gray-500 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare
                            size={18}
                            className="text-blue-600 fill-blue-50"
                          />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {item.group?.name || "-"}
                    </td>

                    {/* QUANTITY DISPLAY */}
                    <td className="py-3 px-4 text-right font-mono text-gray-700">
                      <span className="font-bold">{qty}</span>
                      <span className="text-gray-500 ml-1 text-xs">
                        {item.unit?.symbol || ""}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <Link
                        href={`/companies/${companyId}/inventory/${item.id}/edit`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        disabled={isPending}
                      >
                        <Trash2 size={16} />
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
