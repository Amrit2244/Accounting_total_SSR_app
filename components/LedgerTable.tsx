"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  FileEdit,
  ExternalLink,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  X,
  FolderOpen,
} from "lucide-react";
import { deleteBulkLedgers } from "@/app/actions/masters";
import { useRouter } from "next/navigation";

interface Ledger {
  id: number;
  name: string;
  openingBalance: number;
  group: { name: string } | null;
}

export default function LedgerTable({
  ledgers = [],
  companyId,
}: {
  ledgers: Ledger[];
  companyId: number;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const filteredLedgers = useMemo(
    () =>
      ledgers.filter(
        (l) =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.group?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ledgers, searchTerm]
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLedgers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLedgers.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} ledgers?`
      )
    )
      return;

    startTransition(async () => {
      const res = await deleteBulkLedgers(selectedIds, companyId);
      if (res.success) {
        setSelectedIds([]); // Clear selection
        router.refresh(); // Refresh data
      } else {
        alert(res.message);
      }
    });
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <div className="relative mt-2">
      {/* HEADER / TOOLBAR */}
      <div className="flex justify-between items-end mb-4 h-10">
        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 ? (
          <div className="absolute top-0 left-0 right-0 z-20 bg-indigo-50 border border-indigo-100 rounded-xl px-4 h-10 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
              <span className="bg-indigo-200 px-2 py-0.5 rounded text-[10px]">
                {selectedIds.length}
              </span>
              <span>Ledgers Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? (
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
        ) : (
          // Search Bar Placeholder area (if needed for layout balance) or Search Input itself
          <div className="w-full max-w-xs relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white h-[calc(100vh-240px)] flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-12 text-center border-b border-slate-200 bg-slate-50">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {filteredLedgers.length > 0 &&
                    selectedIds.length === filteredLedgers.length ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  Ledger Name
                </th>
                <th className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  Group
                </th>
                <th className="px-4 py-3 text-right border-b border-slate-200 bg-slate-50">
                  Opening Bal
                </th>
                <th className="px-4 py-3 text-center w-24 border-b border-slate-200 bg-slate-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <FolderOpen size={48} className="text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">
                        No ledgers found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search terms
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((ledger) => {
                  const isSelected = selectedIds.includes(ledger.id);
                  return (
                    <tr
                      key={ledger.id}
                      onClick={() => toggleSelectOne(ledger.id)}
                      className={`group transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleSelectOne(ledger.id)}
                          className="text-slate-300 hover:text-indigo-600 transition-colors"
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
                      <td className="px-4 py-3 font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                        {ledger.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                          {ledger.group?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                        <span
                          className={
                            ledger.openingBalance >= 0
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }
                        >
                          {fmt(Math.abs(ledger.openingBalance))}
                        </span>
                        <span
                          className={`text-[9px] ml-1 uppercase p-0.5 rounded ${
                            ledger.openingBalance >= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {ledger.openingBalance >= 0 ? "Dr" : "Cr"}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/companies/${companyId}/reports/ledger?ledgerId=${ledger.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Ledger Report"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <Link
                            href={`/companies/${companyId}/ledgers/${ledger.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Ledger"
                          >
                            <FileEdit size={16} />
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
      </div>
    </div>
  );
}
