"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, FileEdit, ExternalLink, Trash2, X, Check } from "lucide-react";
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

  const filteredLedgers = useMemo(
    () =>
      ledgers.filter(
        (l) =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.group?.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ledgers, searchTerm]
  );

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.length === filteredLedgers.length
        ? []
        : filteredLedgers.map((l) => l.id)
    );
  const toggleSelectOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} ledgers?`)) return;
    setIsDeleting(true);
    const res = await deleteBulkLedgers(selectedIds, companyId);
    if (res.success) setSelectedIds([]);
    else alert(res.message);
    setIsDeleting(false);
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <div className="relative">
      {selectedIds.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-top-2">
          <span className="text-[10px] font-black uppercase tracking-widest">
            {selectedIds.length} Selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-white font-bold text-[10px] uppercase flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> {isDeleting ? "..." : "Delete"}
          </button>
          <button onClick={() => setSelectedIds([])}>
            <X size={14} className="text-slate-500 hover:text-white" />
          </button>
        </div>
      )}

      <div className="px-4 py-2 border-b border-slate-100 flex justify-end bg-slate-50/50">
        <div className="relative w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Filter accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 h-8 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold focus:border-blue-500 transition-all uppercase placeholder:normal-case"
          />
        </div>
      </div>

      <div className="overflow-x-auto h-[calc(100vh-220px)] custom-scrollbar">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest sticky top-0 z-10 border-b">
            <tr>
              <th className="px-4 py-2 w-10 text-center">
                <input
                  type="checkbox"
                  className="accent-blue-600 cursor-pointer"
                  checked={
                    selectedIds.length === filteredLedgers.length &&
                    filteredLedgers.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2">Ledger Name</th>
              <th className="px-4 py-2">Group</th>
              <th className="px-4 py-2 text-right">Opening Bal</th>
              <th className="px-4 py-2 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLedgers.map((ledger) => {
              const isSelected = selectedIds.includes(ledger.id);
              return (
                <tr
                  key={ledger.id}
                  className={`transition-colors group hover:bg-slate-50 ${
                    isSelected ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-1.5 text-center">
                    <input
                      type="checkbox"
                      className="accent-blue-600 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(ledger.id)}
                    />
                  </td>
                  <td className="px-4 py-1.5 font-bold text-slate-800">
                    {ledger.name}
                  </td>
                  <td className="px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase">
                    {ledger.group?.name}
                  </td>
                  <td
                    className={`px-4 py-1.5 text-right font-mono font-bold ${
                      ledger.openingBalance >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {fmt(Math.abs(ledger.openingBalance))}{" "}
                    <span className="text-[9px] opacity-60 ml-0.5">
                      {ledger.openingBalance >= 0 ? "Dr" : "Cr"}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-center flex justify-center gap-2">
                    <Link
                      href={`/companies/${companyId}/reports/ledger?ledgerId=${ledger.id}`}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <Link
                      href={`/companies/${companyId}/ledgers/${ledger.id}/edit`}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <FileEdit size={14} />
                    </Link>
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
