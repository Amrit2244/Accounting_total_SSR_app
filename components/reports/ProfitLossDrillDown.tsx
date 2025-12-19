"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Circle } from "lucide-react";

const fmt = (v: number) =>
  Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type LedgerItem = {
  name: string;
  amount: number;
};

type GroupItem = {
  groupName: string;
  amount: number;
  ledgers: LedgerItem[];
  isSystem?: boolean; // For Net Profit/Stock/Gross Profit rows
  prefix?: string; // "To" or "By"
};

export default function ProfitLossDrillDown({ item }: { item: GroupItem }) {
  const [isOpen, setIsOpen] = useState(false);

  // System rows (like Net Profit) might not have children, or we might not want to expand them
  // But Stock groups WILL have children (individual items)
  const hasChildren = item.ledgers && item.ledgers.length > 0;

  return (
    <div className="border-b border-slate-50 last:border-none">
      {/* PARENT GROUP ROW */}
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex justify-between items-center py-1.5 px-3 cursor-pointer transition-colors group select-none ${
          item.isSystem
            ? "bg-blue-50/50 hover:bg-blue-100/50 text-blue-900"
            : isOpen
            ? "bg-slate-50"
            : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Icon Indicator */}
          {hasChildren ? (
            <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          ) : (
            <div className="w-3" /> // Spacer
          )}

          {/* Group Name */}
          <span
            className={`text-[11px] font-bold uppercase tracking-tight truncate ${
              item.isSystem ? "text-blue-800" : "text-slate-700"
            }`}
          >
            {item.prefix} {item.groupName}
          </span>
        </div>

        {/* Amount */}
        <span
          className={`font-mono text-[11px] font-bold ${
            item.isSystem ? "text-blue-800" : "text-slate-900"
          }`}
        >
          {fmt(item.amount)}
        </span>
      </div>

      {/* CHILD LEDGERS (EXPANDED) */}
      {isOpen && hasChildren && (
        <div className="bg-slate-50/40 shadow-inner border-t border-slate-100">
          {item.ledgers.map((ledger, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-1 pl-8 pr-3 border-b border-slate-100/50 last:border-none hover:bg-white transition-colors"
            >
              <span className="text-[10px] font-medium text-slate-500 truncate">
                {ledger.name}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {fmt(ledger.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
