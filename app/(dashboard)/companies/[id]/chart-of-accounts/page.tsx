import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Ensure we define params as a Promise for Next.js 15+ compatibility
export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Resolve params
  const { id } = await params;
  const companyId = parseInt(id);

  // 2. Fetch Data
  // We fetch groups recursively (Top Level -> Sub Groups)
  // We also include the ledgers inside them
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    include: {
      ledgers: true,
      children: { include: { ledgers: true } }, // Fetch 1 level deep
    },
    orderBy: { name: "asc" },
  });

  // 3. Filter only Top-Level groups (Parent is null)
  const rootGroups = groups.filter((g) => g.parentId === null);

  return (
    <div className="max-w-4xl mx-auto mt-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-black">
            Chart of Accounts
          </h1>
          <Link
            href={`/`}
            className="text-blue-700 font-medium hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* CREATE LEDGER BUTTON */}
        <Link
          href={`/companies/${companyId}/ledgers/create`}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition shadow-sm text-sm flex items-center gap-2"
        >
          <span>+</span> Create Ledger
        </Link>
      </div>

      {/* LIST SECTION */}
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-300">
        <ul className="space-y-4">
          {rootGroups.map((group) => (
            <li
              key={group.id}
              className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
            >
              {/* Parent Group Name */}
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-lg text-black">
                  {group.name}
                </span>
                <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 uppercase">
                  {group.nature}
                </span>
              </div>

              {/* 1. Ledgers directly under this Main Group */}
              {group.ledgers.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-blue-200 my-2 space-y-1">
                  {group.ledgers.map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between items-center text-sm group hover:bg-gray-50 p-1 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        <span className="font-semibold text-gray-800">
                          {l.name}
                        </span>
                      </div>
                      <span className="font-mono font-medium text-gray-600">
                        {l.openingBalance.toFixed(2)}{" "}
                        {l.openingBalance >= 0 ? "Dr" : "Cr"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Sub-Groups (e.g. Cash-in-hand under Current Assets) */}
              {group.children.length > 0 && (
                <ul className="ml-4 mt-3 space-y-3">
                  {group.children.map((child) => (
                    <li
                      key={child.id}
                      className="bg-gray-50 rounded p-3 border border-gray-200"
                    >
                      <div className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
                        {child.name}
                      </div>

                      {/* Ledgers under Sub-Group */}
                      {child.ledgers.length > 0 ? (
                        <div className="space-y-1">
                          {child.ledgers.map((l) => (
                            <div
                              key={l.id}
                              className="flex justify-between items-center text-sm pl-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                <span className="text-gray-700 font-medium">
                                  {l.name}
                                </span>
                              </div>
                              <span className="font-mono text-gray-500 text-xs">
                                {l.openingBalance.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic pl-2">
                          No ledgers yet
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {rootGroups.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No groups found. Something might be wrong with the company setup.
          </div>
        )}
      </div>
    </div>
  );
}
