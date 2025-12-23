import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { notFound } from "next/navigation";

const fmt = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtQty = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
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

  // 1. Fetch Items with ALL approved inventory source types
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    include: {
      unit: true,
      salesItems: {
        where: { salesVoucher: { status: "APPROVED" } },
      },
      purchaseItems: {
        where: { purchaseVoucher: { status: "APPROVED" } },
      },
      journalEntries: {
        where: { stockJournal: { status: "APPROVED" } },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Process Data for Valuation
  const stockData = items.map((item: any) => {
    const openingQty = item.openingQty || 0;
    const openingVal = item.openingValue || 0;

    let inwardQty = 0;
    let inwardVal = 0;
    let outwardQty = 0;

    // Process Purchases (Inwards)
    item.purchaseItems.forEach((p: any) => {
      inwardQty += p.quantity;
      inwardVal += p.amount;
    });

    // Process Sales (Outwards)
    item.salesItems.forEach((s: any) => {
      outwardQty += Math.abs(s.quantity);
    });

    // Process Stock Journals (Can be In or Out)
    item.journalEntries.forEach((j: any) => {
      if (j.quantity > 0) {
        inwardQty += j.quantity;
        inwardVal += j.amount;
      } else {
        outwardQty += Math.abs(j.quantity);
      }
    });

    const closingQty = openingQty + inwardQty - outwardQty;

    // Weighted Average Cost (WAC) Calculation
    const totalBasisQty = openingQty + inwardQty;
    const totalBasisVal = openingVal + inwardVal;
    const avgRate = totalBasisQty > 0 ? totalBasisVal / totalBasisQty : 0;
    const closingVal = Math.max(0, closingQty * avgRate);

    return {
      id: item.id,
      name: item.name,
      unit: item.unit?.symbol || "nos",
      openingQty,
      openingVal,
      inwardQty,
      inwardVal,
      outwardQty,
      closingQty,
      closingVal,
    };
  });

  // Grand Totals - Added explicit types for accumulator and current item
  const totals = stockData.reduce(
    (acc: any, curr: any) => ({
      op: acc.op + curr.openingVal,
      in: acc.in + curr.inwardVal,
      cl: acc.cl + curr.closingVal,
    }),
    { op: 0, in: 0, cl: 0 }
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 py-8 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Stock Summary
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Inventory Valuation (WAC Method)
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-center">
                <th
                  rowSpan={2}
                  className="p-3 text-left border-r border-slate-700 w-64"
                >
                  Particulars
                </th>
                <th
                  colSpan={2}
                  className="p-2 border-b border-slate-700 border-r border-slate-700"
                >
                  Opening Balance
                </th>
                <th
                  colSpan={2}
                  className="p-2 border-b border-slate-700 border-r border-slate-700"
                >
                  Inwards
                </th>
                <th className="p-2 border-b border-slate-700 border-r border-slate-700">
                  Outwards
                </th>
                <th colSpan={2} className="p-2 border-b border-slate-700">
                  Closing Balance
                </th>
              </tr>
              <tr className="bg-slate-800 text-slate-300 font-bold uppercase tracking-tight text-[9px]">
                <th className="p-2 border-r border-slate-700 w-24">Qty</th>
                <th className="p-2 border-r border-slate-700 w-32">Value</th>
                <th className="p-2 border-r border-slate-700 w-24">Qty</th>
                <th className="p-2 border-r border-slate-700 w-32">Value</th>
                <th className="p-2 border-r border-slate-700 w-24">Qty</th>
                <th className="p-2 border-r border-slate-700 w-24 text-white">
                  Qty
                </th>
                <th className="p-2 text-white">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockData.map((row: any) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 font-bold text-slate-700 border-r">
                    {row.name}
                  </td>
                  <td className="p-2 text-right border-r font-mono text-slate-500">
                    {row.openingQty > 0
                      ? `${fmtQty(row.openingQty)} ${row.unit}`
                      : ""}
                  </td>
                  <td className="p-2 text-right border-r font-mono text-slate-500">
                    {row.openingVal > 0 ? fmt(row.openingVal) : ""}
                  </td>
                  <td className="p-2 text-right border-r font-mono text-emerald-600">
                    {row.inwardQty > 0
                      ? `${fmtQty(row.inwardQty)} ${row.unit}`
                      : ""}
                  </td>
                  <td className="p-2 text-right border-r font-mono text-emerald-600">
                    {row.inwardVal > 0 ? fmt(row.inwardVal) : ""}
                  </td>
                  <td className="p-2 text-right border-r font-mono text-rose-500">
                    {row.outwardQty > 0
                      ? `${fmtQty(row.outwardQty)} ${row.unit}`
                      : ""}
                  </td>
                  <td className="p-2 text-right border-r font-mono font-bold text-slate-900">
                    {fmtQty(row.closingQty)} {row.unit}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                    {fmt(row.closingVal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-black uppercase text-[10px] border-t-2 border-slate-300">
              <tr>
                <td className="p-3 text-right">Grand Total</td>
                <td className="p-2 border-r"></td>
                <td className="p-2 text-right border-r font-mono">
                  {fmt(totals.op)}
                </td>
                <td className="p-2 border-r"></td>
                <td className="p-2 text-right border-r font-mono">
                  {fmt(totals.in)}
                </td>
                <td className="p-2 border-r"></td>
                <td className="p-2 border-r"></td>
                <td className="p-2 text-right font-mono bg-slate-200">
                  {fmt(totals.cl)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
