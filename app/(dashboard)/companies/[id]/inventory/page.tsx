import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch Items AND Units in parallel
  const [items, units] = await prisma.$transaction([
    prisma.stockItem.findMany({
      where: { companyId },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: { companyId },
      orderBy: { symbol: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto mt-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-400">
        <div>
          <h1 className="text-3xl font-extrabold text-black">
            Inventory Masters
          </h1>
          <Link
            href={`/`}
            className="text-blue-700 font-bold hover:underline text-sm mt-1 inline-block"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/inventory/units/create`}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-md transition-all"
          >
            + Create Unit
          </Link>
          <Link
            href={`/companies/${companyId}/inventory/items/create`}
            className="bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-md transition-all"
          >
            + Create Stock Item
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT COLUMN: UNITS LIST */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg border border-gray-400 overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-400">
              <h2 className="text-lg font-extrabold text-black uppercase tracking-wide">
                Units ({units.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-300">
              {units.map((u) => (
                <li
                  key={u.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <span className="block font-bold text-black text-lg">
                      {u.symbol}
                    </span>
                    <span className="block text-xs font-bold text-gray-500 uppercase">
                      {u.name}
                    </span>
                  </div>
                  <span className="text-gray-300">#</span>
                </li>
              ))}
              {units.length === 0 && (
                <li className="p-6 text-center text-gray-500 italic font-medium">
                  No units created.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: STOCK ITEMS TABLE */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg border border-gray-400 overflow-hidden">
            <div className="bg-gray-800 p-4 border-b border-gray-600">
              <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                Stock Items ({items.length})
              </h2>
            </div>

            <table className="w-full text-left">
              <thead className="bg-gray-200 text-black text-xs font-extrabold uppercase border-b border-gray-400">
                <tr>
                  <th className="p-4 border-r border-gray-300">Item Name</th>
                  <th className="p-4 border-r border-gray-300 w-24">Unit</th>
                  <th className="p-4 text-right w-32">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-gray-900">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    <td className="p-4 font-bold text-black border-r border-gray-200">
                      {item.name}
                      <span className="block text-xs font-medium text-gray-500 mt-0.5">
                        Part: {item.partNumber || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800 font-bold border-r border-gray-200">
                      {item.unit?.symbol}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-black bg-gray-50">
                      0 {/* Placeholder for real-time stock */}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-10 text-center text-gray-600 font-medium italic"
                    >
                      No items found. Create a Unit first, then add an Item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
