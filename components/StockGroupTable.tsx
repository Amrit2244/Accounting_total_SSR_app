"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Folder, Edit } from "lucide-react";
import { deleteBulkStockGroups } from "@/app/actions/delete-stock-groups";

export default function StockGroupTable({
  groups,
  companyId,
}: {
  groups: any[];
  companyId: number;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(groups.map((g) => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle One
  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} groups?`)
    )
      return;
    setIsDeleting(true);

    const result = await deleteBulkStockGroups(selectedIds, companyId);
    if (result.error) alert(result.error);

    setSelectedIds([]);
    setIsDeleting(false);
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
      {/* BULK HEADER */}
      {selectedIds.length > 0 ? (
        <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex justify-between items-center animate-in fade-in">
          <span className="text-sm font-bold text-red-800">
            {selectedIds.length} groups selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={14} />{" "}
            {isDeleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      ) : (
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
          <span className="text-xs font-bold text-gray-600 uppercase">
            Group Hierarchy
          </span>
        </div>
      )}

      <table className="w-full text-sm text-left">
        <thead className="bg-[#003366] text-white text-xs uppercase font-bold">
          <tr>
            <th className="p-3 pl-4 w-10">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  groups.length > 0 && selectedIds.length === groups.length
                }
                className="rounded cursor-pointer"
              />
            </th>
            <th className="p-3">Group Name</th>
            <th className="p-3">Parent Group</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {groups.map((g) => (
            <tr
              key={g.id}
              className={`hover:bg-blue-50 ${
                selectedIds.includes(g.id) ? "bg-blue-50" : ""
              }`}
            >
              <td className="p-3 pl-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(g.id)}
                  onChange={() => handleSelectOne(g.id)}
                  className="rounded cursor-pointer"
                />
              </td>
              <td className="p-3 font-bold text-gray-800 flex items-center gap-2">
                <Folder size={16} className="text-yellow-500" />
                {g.name}
              </td>
              <td className="p-3 text-gray-500">
                {g.parent ? (
                  g.parent.name
                ) : (
                  <span className="text-gray-400 italic">Primary</span>
                )}
              </td>
              <td className="p-3 text-center">
                <Link
                  href={`/companies/${companyId}/inventory/groups/${g.id}/edit`}
                  className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-100 rounded"
                >
                  <Edit size={16} />
                </Link>
              </td>
            </tr>
          ))}
          {groups.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-gray-400">
                No stock groups found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
