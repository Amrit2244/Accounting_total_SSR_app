import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Folder,
  FileText,
  FolderOpen,
  Layers,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// Helper to calculate total from entry arrays
const sumEntries = (entries: any[]) =>
  entries.reduce((acc, curr) => acc + curr.amount, 0);

// Recursive component to render the tree with "Tree Lines"
const GroupItem = ({ group, level = 0 }: { group: any; level?: number }) => {
  return (
    <div className="relative select-none">
      {/* Group Header */}
      <div
        className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg transition-colors group/row ${
          level === 0 ? "mb-2 mt-4" : "mt-0.5 hover:bg-slate-50"
        }`}
      >
        {/* Indentation Lines for nested items */}
        {level > 0 && (
          <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-slate-200" />
        )}
        {level > 0 && (
          <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-slate-200" />
        )}

        <div className="flex items-center gap-2 text-slate-800 flex-1">
          {level === 0 ? (
            <div className="p-1 bg-blue-50 text-blue-600 rounded">
              <FolderOpen size={16} />
            </div>
          ) : (
            <Folder size={14} className="text-amber-400 fill-amber-400/20" />
          )}

          <span
            className={`uppercase tracking-tight ${
              level === 0
                ? "text-sm font-black text-slate-900"
                : "text-xs font-bold text-slate-700"
            }`}
          >
            {group.name}
          </span>
        </div>
      </div>

      {/* Children Container */}
      <div
        className={`ml-3 pl-3 ${
          level === 0
            ? "border-l-2 border-slate-100"
            : "border-l border-slate-200"
        }`}
      >
        {/* Render Ledgers inside this group */}
        {group.ledgers?.map((ledger: any) => {
          // 1. Calculate Transactions Total
          const txTotal =
            sumEntries(ledger.salesEntries || []) +
            sumEntries(ledger.purchaseEntries || []) +
            sumEntries(ledger.paymentEntries || []) +
            sumEntries(ledger.receiptEntries || []) +
            sumEntries(ledger.contraEntries || []) +
            sumEntries(ledger.journalEntries || []);

          // 2. Calculate Closing Balance
          const closingBalance = (ledger.openingBalance || 0) + txTotal;

          let balanceDisplay = "0.00";
          let colorClass = "text-slate-400";
          let badgeClass = "bg-slate-100 text-slate-500";
          let sign = "";

          if (closingBalance !== 0) {
            // Logic: Negative = Dr (Red), Positive = Cr (Green)
            if (closingBalance < 0) {
              balanceDisplay = Math.abs(closingBalance).toFixed(2);
              colorClass = "text-rose-600 font-bold";
              badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
              sign = "Dr";
            } else {
              balanceDisplay = Math.abs(closingBalance).toFixed(2);
              colorClass = "text-emerald-600 font-bold";
              badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
              sign = "Cr";
            }
          }

          return (
            <div
              key={ledger.id}
              className="relative flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/ledger"
            >
              {/* Horizontal connector for ledger */}
              <div className="absolute left-[-13px] top-1/2 w-3 h-px bg-slate-200" />

              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText
                  size={13}
                  className="text-slate-400 group-hover/ledger:text-blue-500 transition-colors"
                />
                <span className="text-xs font-medium text-slate-600 group-hover/ledger:text-slate-900 truncate">
                  {ledger.name}
                </span>
              </div>

              <div className="flex items-center gap-2 pl-2">
                <span className={`font-mono text-[10px] ${colorClass}`}>
                  ₹{balanceDisplay}
                </span>
                {sign && (
                  <span
                    className={`text-[9px] font-black uppercase px-1 py-0.5 rounded border ${badgeClass}`}
                  >
                    {sign}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Render Sub-groups recursively */}
        {group.children?.map((child: any) => (
          <GroupItem key={child.id} group={child} level={level + 1} />
        ))}
      </div>
    </div>
  );
};

export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Group Tree AND all nested ledger entries to calculate balances
  const includeLedgers = {
    include: {
      salesEntries: { select: { amount: true } },
      purchaseEntries: { select: { amount: true } },
      paymentEntries: { select: { amount: true } },
      receiptEntries: { select: { amount: true } },
      contraEntries: { select: { amount: true } },
      journalEntries: { select: { amount: true } },
    },
  };

  // Fetch groups and nested structure
  const rootGroups = await prisma.group.findMany({
    where: { companyId, parentId: null },
    include: {
      ledgers: includeLedgers,
      children: {
        include: {
          ledgers: includeLedgers,
          children: {
            include: {
              ledgers: includeLedgers,
              children: {
                include: {
                  ledgers: includeLedgers,
                  children: {
                    include: { ledgers: includeLedgers },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${id}`}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Layers size={20} className="text-slate-400" />
                Chart of Accounts
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Structure Overview
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/companies/${id}/ledgers/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-indigo-600/20"
            >
              <Plus
                size={14}
                className="group-hover:rotate-90 transition-transform"
              />
              <span>Add Ledger</span>
            </Link>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white/50 border border-slate-200 rounded-2xl shadow-sm p-6 backdrop-blur-sm min-h-[600px]">
          <div className="columns-1 md:columns-2 gap-8 space-y-8">
            {rootGroups.map((group: any) => (
              <div
                key={group.id}
                className="break-inside-avoid bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <GroupItem group={group} level={0} />
              </div>
            ))}
          </div>

          {rootGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No Accounts Found
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mt-1">
                Your chart of accounts is empty. Start by creating a ledger
                group or account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
