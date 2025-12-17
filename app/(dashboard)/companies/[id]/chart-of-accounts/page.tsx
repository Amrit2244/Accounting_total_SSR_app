import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Folder,
  FileText,
  ChevronRight,
  FolderOpen,
  Layers,
  Plus,
} from "lucide-react";

// --- RECURSIVE GROUP COMPONENT ---
// Renders the tree structure with connecting lines
const GroupItem = ({ group, level = 0 }: { group: any; level?: number }) => {
  return (
    <div className="relative">
      {/* Group Row */}
      <div
        className={`
          flex items-center gap-2 py-2 pr-4 rounded-lg 
          ${level === 0 ? "mb-2 mt-4" : "mt-1"}
        `}
      >
        {/* Indentation Line Logic */}
        {level > 0 && (
          <div className="absolute left-[-18px] top-0 bottom-0 border-l-2 border-slate-200 w-4 h-full" />
        )}

        {/* Icon & Name */}
        <div className="flex items-center gap-2.5 text-slate-800">
          {/* Different icons for root vs nested groups */}
          {level === 0 ? (
            <FolderOpen size={18} className="text-blue-600 fill-blue-50" />
          ) : (
            <Folder size={16} className="text-amber-500 fill-amber-50" />
          )}
          <span
            className={`font-medium ${
              level === 0 ? "text-base font-bold" : "text-sm"
            }`}
          >
            {group.name}
          </span>
        </div>
      </div>

      {/* Content Container (Children + Ledgers) */}
      <div
        className={`ml-3 pl-3 ${
          level > 0 ? "border-l-2 border-slate-100" : ""
        }`}
      >
        {/* Render Ledgers inside this Group */}
        {group.ledgers.length > 0 && (
          <div className="space-y-1 mb-2">
            {group.ledgers.map((ledger: any) => (
              <div
                key={ledger.id}
                className="group flex items-center justify-between text-sm bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 px-3 py-2 rounded-md transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Visual connector for items */}
                  <div className="w-2 h-[1px] bg-slate-300"></div>
                  <div className="p-1 bg-slate-100 rounded text-slate-500 group-hover:text-blue-600 transition-colors">
                    <FileText size={14} />
                  </div>
                  <span className="text-slate-600 font-medium group-hover:text-slate-900">
                    {ledger.name}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500 group-hover:text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  ₹{" "}
                  {ledger.openingBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recursive: Render Children Groups */}
        {group.children &&
          group.children.map((child: any) => (
            <GroupItem key={child.id} group={child} level={level + 1} />
          ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Prisma Query: Fetch 3 levels deep to build the tree
  const rootGroups = await prisma.group.findMany({
    where: {
      companyId,
      parentId: null, // Top-level groups
    },
    include: {
      ledgers: true,
      children: {
        include: {
          ledgers: true,
          children: {
            include: {
              ledgers: true,
              children: true, // Level 3
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-800">Chart of Accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600" /> Chart of Accounts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visual hierarchy of all Groups and Ledgers.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/companies/${id}`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <Link
            href={`/companies/${id}/ledgers/create`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Ledger
          </Link>
        </div>
      </div>

      {/* 2. Tree Visualization Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Account Hierarchy
          </span>
          <span className="text-xs font-medium text-slate-400">
            {rootGroups.length} Root Groups
          </span>
        </div>

        <div className="p-6">
          {rootGroups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold mb-1">
                No Accounts Found
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Your chart of accounts is currently empty.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href={`/companies/${id}/import`}
                  className="text-blue-600 font-medium hover:underline text-sm"
                >
                  Import from Tally XML
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {rootGroups.map((group) => (
                <div key={group.id} className="mb-6 last:mb-0">
                  <GroupItem group={group} level={0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
