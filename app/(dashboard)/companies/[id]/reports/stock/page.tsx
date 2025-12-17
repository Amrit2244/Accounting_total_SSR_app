import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Package, IndianRupee, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

// Utility function for currency formatting
const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function StockSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

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

  // 2. Calculate Stock Logic (WAC Method)
  const stockData = items.map((item) => {
    let inwardQty = item.quantity || 0; // Assuming opening quantity is included here
    let inwardValue = item.openingValue || 0;
    let outwardQty = 0;

    // Process transactions since opening balance
    item.inventoryEntries.forEach((e) => {
      // Quantity > 0 means INWARD (Purchase, Stock In)
      // Quantity < 0 means OUTWARD (Sale, Stock Out)
      if (e.quantity > 0) {
        inwardQty += e.quantity;
        inwardValue += e.amount; // Amount is total cost/value for that row
      } else {
        outwardQty += Math.abs(e.quantity);
        // Note: Outward value is generally calculated using the WAC rate, not the sale price.
        // We only track the Qty here for balance calculation.
      }
    });

    const closingQty = inwardQty - outwardQty;

    // Weighted Average Cost (WAC) Calculation
    let avgRate = 0;
    if (inwardQty > 0) {
      avgRate = inwardValue / inwardQty;
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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">STOCK SUMMARY</h1>
            <p className="text-sm text-slate-500">
              Inventory Position & Valuation (Weighted Average Cost)
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>

      {/* REPORT CONTENT */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto bg-white border border-slate-200 shadow-lg min-h-[70vh] flex flex-col rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase py-3 px-6 sticky top-0 z-10">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-2 text-right pr-4">Inwards (Qty)</div>
            <div className="col-span-2 text-right pr-4 border-r border-slate-300">
              Outwards (Qty)
            </div>
            <div className="col-span-4 grid grid-cols-4 items-center">
              <div className="col-span-4 text-center text-blue-700">
                Closing Stock
              </div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-1 text-right">Unit</div>
              <div className="col-span-1 text-right">Rate (Avg)</div>
              <div className="col-span-1 text-right">Value (₹)</div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 flex-1 text-sm text-slate-700">
            {stockData.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic">
                No stock items found.
              </div>
            ) : (
              stockData.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-12 py-3 px-6 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="col-span-4 font-semibold text-slate-900 truncate">
                    {row.name}
                  </div>

                  {/* Inward */}
                  <div className="col-span-2 text-right pr-4 font-mono">
                    {row.inwardQty > 0 ? row.inwardQty : "-"}
                  </div>

                  {/* Outward */}
                  <div className="col-span-2 text-right pr-4 border-r border-slate-200 font-mono">
                    {row.outwardQty > 0 ? row.outwardQty : "-"}
                  </div>

                  {/* Closing Group */}
                  <div className="col-span-4 grid grid-cols-4 text-xs items-center">
                    <div className="col-span-1 text-right font-mono font-bold text-base">
                      {row.closingQty}
                    </div>
                    <div className="col-span-1 text-right font-medium text-slate-500">
                      {row.unit}
                    </div>
                    <div className="col-span-1 text-right font-mono text-slate-600">
                      {row.closingRate.toFixed(2)}
                    </div>
                    <div className="col-span-1 text-right font-mono font-bold text-lg text-blue-800">
                      {formatCurrency(row.closingValue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-12 bg-slate-800 text-white py-4 px-6 border-t-2 border-blue-700 text-base font-extrabold mt-auto rounded-b-xl">
            <div className="col-span-10 text-right pr-4 uppercase flex items-center justify-end gap-2">
              <Package size={20} className="text-yellow-300" />
              Total Inventory Value
            </div>
            <div className="col-span-2 text-right font-mono text-yellow-300 flex items-center justify-end gap-1">
              <IndianRupee size={18} />
              {formatCurrency(totalStockValue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
