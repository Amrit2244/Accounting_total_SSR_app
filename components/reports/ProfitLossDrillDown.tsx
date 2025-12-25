"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  Layers,
} from "lucide-react";

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
  const hasChildren = item.ledgers && item.ledgers.length > 0;

  return (
    <div className="border-b border-slate-100 last:border-none group/container transition-all">
      {/* --- PARENT GROUP ROW --- */}
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex justify-between items-center py-2.5 px-4 cursor-pointer transition-all select-none relative overflow-hidden ${
          item.isSystem
            ? "bg-slate-100 hover:bg-slate-200 text-slate-900 border-l-4 border-slate-900" // System Row Style
            : isOpen
            ? "bg-slate-50 text-indigo-900 border-l-4 border-indigo-500" // Expanded Style
            : "hover:bg-slate-50 border-l-4 border-transparent hover:border-slate-300 bg-white" // Default Style
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Icon Indicator */}
          <div
            className={`transition-transform duration-200 ${
              item.isSystem
                ? "text-slate-400"
                : isOpen
                ? "text-indigo-500"
                : "text-slate-300 group-hover/container:text-slate-500"
            }`}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown size={14} strokeWidth={3} />
              ) : (
                <ChevronRight size={14} strokeWidth={3} />
              )
            ) : (
              <Layers size={14} className="opacity-50" />
            )}
          </div>

          {/* Group Name */}
          <span
            className={`text-[10px] font-black uppercase tracking-widest truncate ${
              item.isSystem ? "text-slate-800" : "text-slate-600"
            }`}
          >
            <span className="text-slate-400 font-bold mr-1">{item.prefix}</span>
            {item.groupName}
          </span>
        </div>

        {/* Amount */}
        <span
          className={`font-mono text-xs font-bold tracking-tight ${
            item.isSystem ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {fmt(item.amount)}
        </span>
      </div>

      {/* --- CHILD LEDGERS (EXPANDED) --- */}
      {isOpen && hasChildren && (
        <div className="bg-slate-50/50 shadow-inner border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
          {item.ledgers.map((ledger, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 pl-6 pr-4 border-b border-slate-100 last:border-none hover:bg-white transition-colors group/item relative"
            >
              {/* Visual Guide Line */}
              <div className="absolute left-6 top-0 bottom-1/2 w-px bg-indigo-100 group-last/item:h-1/2" />
              <div className="absolute left-6 top-1/2 w-3 h-px bg-indigo-100" />

              <div className="flex items-center gap-3 pl-4">
                <CornerDownRight
                  size={12}
                  className="text-indigo-300 shrink-0"
                />
                <span className="text-xs font-semibold text-slate-500 group-hover/item:text-indigo-700 transition-colors truncate max-w-[200px] md:max-w-md">
                  {ledger.name}
                </span>
              </div>

              <span className="font-mono text-[10px] font-bold text-slate-400 group-hover/item:text-slate-700 transition-colors">
                {fmt(ledger.amount)}
              </span>
            </div>
          ))}

          {/* Summary Footer for Group (Optional visual separator) */}
          <div className="h-1 bg-gradient-to-b from-slate-100/50 to-transparent" />
        </div>
      )}
    </div>
  );
}
