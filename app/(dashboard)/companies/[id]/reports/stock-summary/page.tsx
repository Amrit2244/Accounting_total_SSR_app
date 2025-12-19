import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { notFound } from "next/navigation";

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
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

  // 1. Fetch Items with APPROVED inventory entries
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: {
      unit: true,
      inventoryEntries: {
        where: { voucher: { status: "APPROVED" } },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Calculate WAC (Weighted Average Cost)
  const stockData = items.map((item) => {
    let inwardQty = item.quantity || 0; // Opening Qty
    // ✅ FIX: Use openingValue directly
    let inwardValue = item.openingValue || 0;
    let outwardQty = 0;

    item.inventoryEntries.forEach((e) => {
      // Inwards: Purchases, Stock Journal Production, Sales Returns (if handled)
      if (e.quantity > 0) {
        inwardQty += e.quantity;
        inwardValue += e.amount;
      }
      // Outwards: Sales, Consumption
      else {
        outwardQty += Math.abs(e.quantity);
      }
    });

    const closingQty = inwardQty - outwardQty;

    // WAC Logic: Total Cost / Total Inward Qty
    let avgRate = inwardQty > 0 ? inwardValue / inwardQty : 0;

    // ✅ FIX: Removed fallback to 'item.openingRate' since it doesn't exist.
    // Instead, if avgRate is 0 but we have opening value/qty, recalculate.
    if (avgRate === 0 && (item.openingQty || 0) > 0) {
      avgRate = (item.openingValue || 0) / (item.openingQty || 1);
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

  const totalStockValue = stockData.reduce(
    (sum, item) => sum + item.closingValue,
    0
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-64px)]">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-900 rounded text-white shadow-sm">
            <Package size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Stock Summary
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Inventory Position & WAC Valuation
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-sm"
        >
          <ArrowLeft size={14} /> Back to Reports
        </Link>
      </div>

      {/* MAIN REPORT TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        {/* Table Head (High Density) */}
        <div className="grid grid-cols-12 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.1em] py-2 px-4 sticky top-0 z-10">
          <div className="col-span-4 flex items-center">Item Description</div>
          <div className="col-span-2 text-right border-x border-white/10 px-2">
            Inwards (Qty)
          </div>
          <div className="col-span-2 text-right border-r border-white/10 px-2">
            Outwards (Qty)
          </div>
          <div className="col-span-4 grid grid-cols-4 px-2 bg-blue-800/40">
            <div className="col-span-1 text-right">Closing Qty</div>
            <div className="col-span-1 text-center">Unit</div>
            <div className="col-span-1 text-right">Rate</div>
            <div className="col-span-1 text-right">Value (₹)</div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {stockData.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
              No inventory records found.
            </div>
          ) : (
            stockData.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 text-[11px] py-1.5 px-4 border-b border-slate-50 hover:bg-blue-50/50 transition-colors items-center group"
              >
                <div className="col-span-4 font-bold text-slate-700 uppercase tracking-tighter truncate pr-4">
                  {row.name}
                </div>

                <div className="col-span-2 text-right px-2 font-mono text-slate-400">
                  {row.inwardQty > 0 ? row.inwardQty : "—"}
                </div>

                <div className="col-span-2 text-right px-2 font-mono text-slate-400 border-r border-slate-100">
                  {row.outwardQty > 0 ? row.outwardQty : "—"}
                </div>

                {/* Closing Group (Blue Highlight) */}
                <div className="col-span-4 grid grid-cols-4 px-2 items-center">
                  <div
                    className={`col-span-1 text-right font-mono font-black ${
                      row.closingQty < 0 ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {row.closingQty}
                  </div>
                  <div className="col-span-1 text-center text-[9px] font-black text-slate-400">
                    {row.unit || "-"}
                  </div>
                  <div className="col-span-1 text-right font-mono text-slate-500">
                    {row.closingRate.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right font-mono font-black text-blue-700">
                    {formatCurrency(row.closingValue)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL FOOTER (Standard ERP Style) */}
        <div className="grid grid-cols-12 bg-slate-100 py-3 px-4 border-t-2 border-slate-900 mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="col-span-8 text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-end gap-2">
            <Package size={14} /> Total Inventory Assets
          </div>
          <div className="col-span-4 text-right font-mono text-sm font-black text-slate-900 border-l border-slate-300 pl-4">
            ₹ {formatCurrency(totalStockValue)}
          </div>
        </div>
      </div>

      {/* Legend / Status */}
      <div className="flex justify-between items-center px-1">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
          *** End of Stock Valuation Report ***
        </p>
        <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full" /> Closing Bal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full" /> Historical
            Flow
          </span>
        </div>
      </div>
    </div>
  );
}
