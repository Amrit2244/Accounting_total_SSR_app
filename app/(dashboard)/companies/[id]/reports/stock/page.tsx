import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

export default async function StockSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch Items with their Inventory Entries
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: {
      unit: true,
      inventoryEntries: {
        where: { voucher: { status: "APPROVED" } }, // Only Verified entries
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Calculate Stock Logic
  const stockData = items.map((item) => {
    let inwardQty = 0;
    let inwardValue = 0;
    let outwardQty = 0;
    let outwardValue = 0; // Not strictly used for Closing Value calculation in WAC, but good for display

    item.inventoryEntries.forEach((e) => {
      // In our voucher logic:
      // Sales = Negative Qty
      // Purchase = Positive Qty

      if (e.quantity > 0) {
        // INWARD (Purchase)
        inwardQty += e.quantity;
        inwardValue += e.amount; // Amount is total for that row
      } else {
        // OUTWARD (Sales)
        outwardQty += Math.abs(e.quantity);
        outwardValue += e.amount;
      }
    });

    const closingQty = inwardQty - outwardQty;

    // Weighted Average Cost (WAC) Logic
    // Avg Rate = Total Inward Cost / Total Inward Qty
    let avgRate = 0;
    if (inwardQty > 0) {
      avgRate = inwardValue / inwardQty;
    }

    // Fallback: If no inward (e.g., negative stock scenario), take last known rate or 0
    if (inwardQty === 0 && item.inventoryEntries.length > 0) {
      // Just a fallback to avoid NaN, though standard accounting doesn't like negative stock without purchase
      avgRate = item.inventoryEntries[item.inventoryEntries.length - 1].rate;
    }

    const closingValue = closingQty * avgRate;

    return {
      id: item.id,
      name: item.name,
      unit: item.unit?.symbol,
      inwardQty,
      outwardQty,
      closingQty,
      closingRate: avgRate,
      closingValue,
    };
  });

  // Calculate Grand Total Value
  const totalStockValue = stockData.reduce(
    (sum, item) => sum + item.closingValue,
    0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] bg-slate-100">
      {/* HEADER */}
      <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Package size={18} /> STOCK SUMMARY
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-wider">
            Inventory Position & Valuation (Weighted Average)
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/companies/${companyId}/reports`}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-1"
          >
            <ArrowLeft size={12} /> BACK
          </Link>
        </div>
      </div>

      {/* REPORT CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto bg-white border border-gray-300 shadow-sm min-h-[600px] flex flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gray-100 border-b-2 border-gray-300 text-[11px] font-bold text-[#003366] uppercase py-3 px-4 sticky top-0">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-2 text-right border-r border-gray-300 pr-4">
              Inwards
            </div>
            <div className="col-span-2 text-right border-r border-gray-300 pr-4">
              Outwards
            </div>
            <div className="col-span-4 text-center">Closing Balance</div>
          </div>

          {/* Sub-Header for Closing Bal Breakdown */}
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-300 text-[10px] font-bold text-gray-500 uppercase py-1 px-4">
            <div className="col-span-4"></div>
            <div className="col-span-2 text-right pr-4">Qty</div>
            <div className="col-span-2 text-right pr-4">Qty</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1 text-right">Rate</div>
            <div className="col-span-2 text-right">Value</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-200 flex-1 text-xs text-slate-700">
            {stockData.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 py-2 px-4 hover:bg-blue-50 transition-colors"
              >
                <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#004b8d] rounded-full"></div>
                  {row.name}
                </div>

                {/* Inward */}
                <div className="col-span-2 text-right pr-4 font-mono">
                  {row.inwardQty > 0 ? row.inwardQty : "-"}
                </div>

                {/* Outward */}
                <div className="col-span-2 text-right pr-4 font-mono">
                  {row.outwardQty > 0 ? row.outwardQty : "-"}
                </div>

                {/* Closing Group */}
                <div className="col-span-1 text-right font-mono font-bold">
                  {row.closingQty} {row.unit}
                </div>
                <div className="col-span-1 text-right font-mono text-gray-500">
                  {row.closingRate.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-black">
                  {row.closingValue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}

            {stockData.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic">
                No stock items found.
              </div>
            )}
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-12 bg-[#003366] text-white py-3 px-4 border-t-2 border-[#002244] text-sm font-bold sticky bottom-0">
            <div className="col-span-10 text-right pr-4 uppercase">
              Total Inventory Value:
            </div>
            <div className="col-span-2 text-right font-mono text-yellow-300">
              {totalStockValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
