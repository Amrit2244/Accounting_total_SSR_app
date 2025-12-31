import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Contact,
  FolderPlus,
  Plus,
  Search,
  Layers,
} from "lucide-react";
import GroupItem from "@/components/chart-of-accounts/GroupItem";

export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId) || companyId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Invalid Company ID
      </div>
    );
  }

  // 1. Fetch ALL Groups and Ledgers flat
  const allGroups = await prisma.group.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  const allLedgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    // We only need openingBalance for this view
    select: {
      id: true,
      name: true,
      openingBalance: true,
      groupId: true,
    },
  });

  // 2. Build the Tree Structure in Memory
  const groupMap = new Map();

  allGroups.forEach((g) =>
    groupMap.set(g.id, { ...g, children: [], ledgers: [] })
  );

  const rootGroups: any[] = [];

  // Assign Groups to their Parents
  allGroups.forEach((g) => {
    const currentGroup = groupMap.get(g.id);
    if (g.parentId && groupMap.has(g.parentId)) {
      groupMap.get(g.parentId).children.push(currentGroup);
    } else {
      rootGroups.push(currentGroup);
    }
  });

  // Assign Ledgers to their Groups
  allLedgers.forEach((l) => {
    if (l.groupId && groupMap.has(l.groupId)) {
      groupMap.get(l.groupId).ledgers.push(l);
    }
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

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Masters</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Layers className="text-slate-900" size={32} />
              Chart of Accounts
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl text-sm">
              Tree view of all Groups and Ledgers. Hover over items to edit or
              delete.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Switch to List View"
            >
              <Contact size={20} />
            </Link>

            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </Link>

            <Link
              href={`/companies/${companyId}/groups/create`}
              className="group flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FolderPlus size={16} />
              <span>New Group</span>
            </Link>

            <Link
              href={`/companies/${companyId}/ledgers/create`}
              className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus
                size={16}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>New Ledger</span>
            </Link>
          </div>
        </div>

        {/* TREE VIEW CONTENT */}
        <div className="bg-white/60 border border-slate-200 rounded-2xl shadow-sm p-6 backdrop-blur-sm min-h-[600px]">
          {rootGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Chart of Accounts is Empty
              </h3>
            </div>
          ) : (
            <div className="columns-1 lg:columns-2 gap-6 space-y-6">
              {rootGroups.map((group: any) => (
                <div
                  key={group.id}
                  className="break-inside-avoid bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <GroupItem group={group} level={0} companyId={companyId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
