import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Folder,
  FileText,
  FolderOpen,
  Layers,
  Plus,
} from "lucide-react";

const GroupItem = ({ group, level = 0 }: { group: any; level?: number }) => {
  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 py-1 pr-4 rounded ${
          level === 0 ? "mb-1 mt-3" : "mt-0.5"
        }`}
      >
        <div className="flex items-center gap-2 text-slate-800">
          {level === 0 ? (
            <FolderOpen size={14} className="text-blue-600" />
          ) : (
            <Folder size={13} className="text-amber-500" />
          )}
          <span
            className={`uppercase tracking-tighter ${
              level === 0
                ? "text-xs font-black"
                : "text-[11px] font-bold text-slate-600"
            }`}
          >
            {group.name}
          </span>
        </div>
      </div>

      <div className={`ml-4 pl-3 border-l border-slate-200`}>
        {group.ledgers?.map((ledger: any) => (
          <div
            key={ledger.id}
            className="flex items-center justify-between text-[11px] hover:bg-blue-50 py-1 px-2 rounded-md group transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText
                size={12}
                className="text-slate-400 group-hover:text-blue-600"
              />
              <span className="font-medium text-slate-700">{ledger.name}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              ₹{ledger.openingBalance.toFixed(2)}
            </span>
          </div>
        ))}
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

  // ✅ FIX: Using 'group' instead of 'accountGroup'
  // If your model is named 'AccountGroup', change this back but ensure you run 'npx prisma generate'
  const rootGroups = await prisma.group.findMany({
    where: {
      companyId,
      parentId: null,
    },
    include: {
      ledgers: true,
      children: {
        include: {
          ledgers: true,
          children: {
            include: {
              ledgers: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
          <Layers size={20} className="text-blue-600" /> Chart of Accounts
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/companies/${id}`}
            className="px-3 py-1.5 text-[10px] font-black uppercase border border-slate-200 rounded hover:bg-slate-50"
          >
            Back
          </Link>
          <Link
            href={`/companies/${id}/ledgers/create`}
            className="px-3 py-1.5 text-[10px] font-black uppercase bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
          >
            + Add Ledger
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 columns-1 md:columns-2 gap-8">
          {rootGroups.map((group) => (
            <div key={group.id} className="break-inside-avoid mb-4">
              <GroupItem group={group} level={0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
