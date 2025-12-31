"use client";

import { deleteGroup } from "@/app/actions/groups";
import {
  Folder,
  FolderOpen,
  FileText,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

// Helper to sum amounts
const sumEntries = (entries: any[]) =>
  entries?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

export default function GroupItem({
  group,
  level = 0,
  companyId,
}: {
  group: any;
  level?: number;
  companyId: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      confirm(`Delete group "${group.name}"? Only empty groups can be deleted.`)
    ) {
      startTransition(async () => {
        try {
          await deleteGroup(group.id, companyId);
        } catch (e) {
          alert("Error: Cannot delete non-empty group.");
        }
      });
    }
  };

  return (
    <div className="relative select-none">
      {/* GROUP ROW */}
      <div
        className={`flex items-center justify-between py-2 pr-2 rounded-lg transition-colors group/row ${
          level === 0 ? "mb-2 mt-4" : "mt-0.5 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden px-1">
          {level === 0 ? (
            <div className="p-1 bg-indigo-50 text-indigo-600 rounded">
              <FolderOpen size={16} />
            </div>
          ) : (
            <Folder size={14} className="text-amber-400 fill-amber-400/20" />
          )}

          <span
            className={`truncate ${
              level === 0
                ? "text-sm font-black text-slate-900 uppercase tracking-tight"
                : "text-[11px] font-bold text-slate-600 uppercase"
            }`}
          >
            {group.name}
          </span>
        </div>

        {/* ACTIONS (Edit/Delete) */}
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity px-2">
          <Link
            href={`/companies/${companyId}/groups/${group.id}/edit`}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 size={12} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* CHILDREN CONTAINER */}
      <div
        className={`ml-3 pl-3 ${
          level === 0
            ? "border-l-2 border-slate-100"
            : "border-l border-slate-200"
        }`}
      >
        {/* Render Ledgers */}
        {group.ledgers?.map((ledger: any) => {
          // Standard Calculation
          const txTotal =
            sumEntries(ledger.salesEntries) +
            sumEntries(ledger.purchaseEntries) +
            sumEntries(ledger.paymentEntries) +
            sumEntries(ledger.receiptEntries) +
            sumEntries(ledger.contraEntries) +
            sumEntries(ledger.journalEntries);

          const closingBalance = (ledger.openingBalance || 0) + txTotal;

          let balanceDisplay = "0.00";
          let colorClass = "text-slate-400";
          let signLabel = "";

          if (closingBalance !== 0) {
            balanceDisplay = Math.abs(closingBalance).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            });

            /**
             * ✅ FIXED LOGIC FOR CHART OF ACCOUNTS:
             * Based on Tally standard: Negative is Debit, Positive is Credit.
             */
            if (closingBalance < 0) {
              colorClass = "text-rose-600 font-bold";
              signLabel = "Dr";
            } else {
              colorClass = "text-emerald-600 font-bold";
              signLabel = "Cr";
            }
          }

          return (
            <div
              key={ledger.id}
              className="relative flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/ledger"
            >
              {/* Indentation line for ledger */}
              <div className="absolute left-[-13px] top-1/2 w-3 h-px bg-slate-200" />

              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText
                  size={13}
                  className="text-slate-400 group-hover/ledger:text-indigo-500 transition-colors"
                />
                <span className="text-xs font-medium text-slate-600 group-hover/ledger:text-slate-900 truncate">
                  {ledger.name}
                </span>
              </div>

              <div className="flex items-center gap-3 pl-2">
                <div className="flex items-baseline gap-1 bg-slate-50/50 px-2 py-0.5 rounded border border-slate-100/50">
                  <span className={`font-mono text-[10px] ${colorClass}`}>
                    ₹{balanceDisplay}
                  </span>
                  {signLabel && (
                    <span
                      className={`text-[8px] font-black uppercase ${
                        closingBalance < 0
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {signLabel}
                    </span>
                  )}
                </div>
                <Link
                  href={`/companies/${companyId}/ledgers/${ledger.id}/edit`}
                  className="opacity-0 group-hover/ledger:opacity-100 text-slate-300 hover:text-slate-600 transition-opacity"
                >
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Recursive Sub-groups */}
        {group.children?.map((child: any) => (
          <GroupItem
            key={child.id}
            group={child}
            level={level + 1}
            companyId={companyId}
          />
        ))}
      </div>
    </div>
  );
}
