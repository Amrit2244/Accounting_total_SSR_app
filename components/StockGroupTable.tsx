"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Trash2,
  Folder,
  Edit,
  CheckSquare,
  Square,
  FolderOpen,
  Loader2,
  X,
} from "lucide-react";
import { deleteBulkStockGroups } from "@/app/actions/delete-stock-groups";
import { useRouter } from "next/navigation";

export default function StockGroupTable({
  groups,
  companyId,
}: {
  groups: any[];
  companyId: number;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  // Toggle All
  const toggleSelectAll = () => {
    if (selectedIds.length === groups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(groups.map((g) => g.id));
    }
  };

  // Toggle One
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} groups? This action cannot be undone.`
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteBulkStockGroups(selectedIds, companyId);
      if (result.error) {
        alert(result.error);
      } else {
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  return (
    <div className="relative mt-4">
      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="absolute -top-12 left-0 right-0 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex justify-between items-center z-20 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
            <span className="bg-indigo-200 px-2 py-0.5 rounded text-[10px]">
              {selectedIds.length}
            </span>
            <span>Groups Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {groups.length > 0 && selectedIds.length === groups.length ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Group Name
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Parent Group
              </th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right w-24">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <FolderOpen size={48} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      No stock groups found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create groups to organize your inventory.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              groups.map((g) => {
                const isSelected = selectedIds.includes(g.id);
                return (
                  <tr
                    key={g.id}
                    className={`group transition-colors ${
                      isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSelect(g.id)}
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
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-700 group-hover:text-indigo-700 transition-colors">
                        <Folder
                          size={16}
                          className="text-amber-400 fill-amber-50"
                        />
                        {g.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-500">
                      {g.parent ? (
                        <span className="flex items-center gap-1.5">
                          <Folder size={12} className="text-slate-300" />
                          {g.parent.name}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/companies/${companyId}/inventory/groups/${g.id}/edit`}
                        className="inline-flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Edit Group"
                      >
                        <Edit size={16} />
                      </Link>
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
