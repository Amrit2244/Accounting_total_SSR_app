// src/app/(dashboard)/companies/[id]/chart-of-accounts/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Folder, FileText } from "lucide-react";
import { use } from "react";

// Helper Component to display Groups recursively
const GroupItem = ({ group }: { group: any }) => {
  return (
    <div className="ml-4 border-l border-slate-200 pl-4 py-1">
      <div className="flex items-center gap-2 text-slate-700 font-medium">
        <Folder size={16} className="text-yellow-500" />
        {group.name}
      </div>

      {/* Render Ledgers inside this Group */}
      {group.ledgers.length > 0 && (
        <div className="ml-4 mt-1 space-y-1">
          {group.ledgers.map((ledger: any) => (
            <div
              key={ledger.id}
              className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} className="text-blue-400" />
                {ledger.name}
              </span>
              <span className="font-mono text-xs">
                ₹{ledger.openingBalance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recursive: Render Children Groups */}
      {group.children &&
        group.children.map((child: any) => (
          <GroupItem key={child.id} group={child} />
        ))}
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

  // ✅ FIX: Changed 'accountGroup' to 'group'
  // We fetch only "Root" groups (parentId is null) to build the tree correctly
  const rootGroups = await prisma.group.findMany({
    where: {
      companyId,
      parentId: null, // Get top-level groups first
    },
    include: {
      ledgers: true,
      children: {
        include: {
          ledgers: true,
          children: {
            // 3 levels deep usually covers most Tally structures
            include: {
              ledgers: true,
              children: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500">
            Your Groups & Ledgers Hierarchy
          </p>
        </div>
        <Link
          href={`/companies/${id}`}
          className="text-sm font-bold text-gray-500 hover:text-[#003366] flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Tree View */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        {rootGroups.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No accounts found.</p>
            <Link
              href={`/companies/${id}/import`}
              className="text-blue-600 underline text-sm mt-2 block"
            >
              Import from Tally
            </Link>
          </div>
        ) : (
          rootGroups.map((group) => <GroupItem key={group.id} group={group} />)
        )}
      </div>
    </div>
  );
}
