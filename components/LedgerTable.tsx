"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  FileEdit,
  UserCircle,
  FolderTree,
  ExternalLink,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { deleteBulkLedgers } from "@/app/actions/masters";

interface Ledger {
  id: number;
  name: string;
  openingBalance: number;
  group: { name: string };
}

export default function LedgerTable({
  ledgers = [],
  companyId,
}: {
  ledgers: Ledger[];
  companyId: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredLedgers = useMemo(() => {
    return ledgers.filter(
      (l) =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.group?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledgers, searchTerm]);

  // Bulk Select Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLedgers.length) setSelectedIds([]);
    else setSelectedIds(filteredLedgers.map((l) => l.id));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} ledger(s)?`)) return;

    setIsDeleting(true);
    const res = await deleteBulkLedgers(selectedIds, companyId);

    if (res.success) {
      setSelectedIds([]);
    } else {
      alert(res.message);
    }
    setIsDeleting(false);
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
      Math.abs(n)
    );

  return (
    <div className="relative">
      {/* --- FLOATING BULK ACTION BAR --- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
              {selectedIds.length}
            </div>
            <span className="text-sm font-bold tracking-tight">
              Ledgers Selected
            </span>
          </div>

          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              "Processing..."
            ) : (
              <>
                <Trash2 size={16} /> Delete Permanently
              </>
            )}
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* SEARCH HEADER */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em]">
              <th className="px-6 py-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  checked={
                    selectedIds.length === filteredLedgers.length &&
                    filteredLedgers.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4">Ledger Name</th>
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-right">Opening Balance</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLedgers.map((ledger) => {
              const isSelected = selectedIds.includes(ledger.id);
              return (
                <tr
                  key={ledger.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-6 py-5 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(ledger.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isSelected ? (
                          <Check size={18} />
                        ) : (
                          <UserCircle size={20} />
                        )}
                      </div>
                      <span
                        className={`font-bold tracking-tight ${
                          isSelected ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {ledger.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 font-medium italic">
                      <FolderTree size={14} className="opacity-40" />
                      {ledger.group?.name}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold">
                    <span
                      className={
                        ledger.openingBalance >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }
                    >
                      {formatMoney(ledger.openingBalance)}
                      <span className="text-[10px] ml-1 opacity-50 uppercase">
                        {ledger.openingBalance >= 0 ? "Dr" : "Cr"}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/companies/${companyId}/reports/ledger?ledgerId=${ledger.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <Link
                        href={`/companies/${companyId}/ledgers/edit/${ledger.id}`}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100"
                      >
                        <FileEdit size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
