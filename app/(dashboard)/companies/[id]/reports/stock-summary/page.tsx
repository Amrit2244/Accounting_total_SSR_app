import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ChevronRight,
  Boxes,
  ShieldCheck,
} from "lucide-react";
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

  /** * ✅ AUTO-VERIFY COMPATIBILITY:
   * We fetch source data only from APPROVED vouchers.
   * This includes standard checker-approved AND admin auto-approved vouchers.
   */
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

  // 2. Process Data for Valuation using Weighted Average Logic
  const stockData = items.map((item: any) => {
    const openingQty = item.openingQty || 0;
    const openingVal = Math.abs(item.openingValue || 0);

    let inwardQty = 0;
    let inwardVal = 0;
    let outwardQty = 0;

    // Inwards (Purchases)
    item.purchaseItems.forEach((p: any) => {
      inwardQty += p.quantity;
      inwardVal += Math.abs(p.amount);
    });

    // Outwards (Sales)
    item.salesItems.forEach((s: any) => {
      outwardQty += Math.abs(s.quantity);
    });

    // Stock Journals (Adjustment In/Out)
    item.journalEntries.forEach((j: any) => {
      if (j.quantity > 0) {
        inwardQty += j.quantity;
        inwardVal += Math.abs(j.amount);
      } else {
        outwardQty += Math.abs(j.quantity);
      }
    });

    const closingQty = openingQty + inwardQty - outwardQty;

    // Valuation Logic: Average inward rate applied to closing quantity
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
      avgRate,
    };
  });

  const totals = stockData.reduce(
    (acc: any, curr: any) => ({
      op: acc.op + curr.openingVal,
      in: acc.in + curr.inwardVal,
      cl: acc.cl + curr.closingVal,
    }),
    { op: 0, in: 0, cl: 0 }
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 flex flex-col">
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col h-full space-y-6 flex-1">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Workspace
              </Link>
              <ChevronRight size={10} />
              <Link
                href={`/companies/${companyId}/reports`}
                className="hover:text-indigo-600 transition-colors"
              >
                Reports
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Stock Summary</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Boxes className="text-indigo-600" size={32} />
              Stock Summary
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl mr-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-700">
                Audit-Verified Valuation
              </span>
            </div>
            <Link
              href={`/companies/${companyId}/reports`}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest text-center">
                  <th
                    rowSpan={2}
                    className="p-4 text-left border-r border-slate-700 w-64 bg-slate-900 sticky left-0 z-20"
                  >
                    Item Description
                  </th>
                  <th
                    colSpan={2}
                    className="p-2 border-b border-slate-700 border-r border-slate-700"
                  >
                    Opening Balance
                  </th>
                  <th
                    colSpan={2}
                    className="p-2 border-b border-slate-700 border-r border-slate-700 bg-emerald-900/50"
                  >
                    Inwards (Purchase)
                  </th>
                  <th className="p-2 border-b border-slate-700 border-r border-slate-700 bg-rose-900/50">
                    Outwards (Sales)
                  </th>
                  <th
                    colSpan={2}
                    className="p-2 border-b border-slate-700 bg-indigo-900/50"
                  >
                    Closing Stock
                  </th>
                </tr>
                <tr className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-200">
                  <th className="p-2 text-right border-r border-slate-200 w-24">
                    Qty
                  </th>
                  <th className="p-2 text-right border-r border-slate-200 w-32">
                    Value
                  </th>
                  <th className="p-2 text-right border-r border-slate-200 w-24 bg-emerald-50">
                    Qty
                  </th>
                  <th className="p-2 text-right border-r border-slate-200 w-32 bg-emerald-50">
                    Value
                  </th>
                  <th className="p-2 text-right border-r border-slate-200 w-24 bg-rose-50">
                    Qty
                  </th>
                  <th className="p-2 text-right border-r border-slate-200 w-24 bg-indigo-50">
                    Qty
                  </th>
                  <th className="p-2 text-right w-32 bg-indigo-50">
                    Closing Val
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {stockData.map((row: any) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-slate-50 transition-colors text-[11px]"
                  >
                    <td className="p-4 font-bold text-slate-700 border-r border-slate-100 bg-white sticky left-0 group-hover:bg-slate-50">
                      {row.name}
                    </td>
                    <td className="p-2 text-right border-r border-slate-100 font-mono text-slate-500">
                      {row.openingQty > 0
                        ? `${fmtQty(row.openingQty)} ${row.unit}`
                        : "-"}
                    </td>
                    <td className="p-2 text-right border-r border-slate-100 font-mono text-slate-500">
                      {row.openingVal > 0 ? fmt(row.openingVal) : "-"}
                    </td>

                    <td className="p-2 text-right border-r border-slate-100 font-mono text-emerald-600 bg-emerald-50/10">
                      {row.inwardQty > 0
                        ? `${fmtQty(row.inwardQty)} ${row.unit}`
                        : "-"}
                    </td>
                    <td className="p-2 text-right border-r border-slate-100 font-mono text-emerald-600 bg-emerald-50/10">
                      {row.inwardVal > 0 ? fmt(row.inwardVal) : "-"}
                    </td>

                    <td className="p-2 text-right border-r border-slate-100 font-mono text-rose-600 bg-rose-50/10">
                      {row.outwardQty > 0
                        ? `${fmtQty(row.outwardQty)} ${row.unit}`
                        : "-"}
                    </td>

                    <td className="p-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900 bg-indigo-50/10">
                      {fmtQty(row.closingQty)}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-indigo-700 bg-indigo-50/20">
                      {fmt(row.closingVal)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase border-t border-slate-800 sticky bottom-0 z-10">
                <tr>
                  <td className="p-4 text-right sticky left-0 bg-slate-900 border-r border-slate-700">
                    Total Company Valuation
                  </td>
                  <td className="p-2 border-r border-slate-700"></td>
                  <td className="p-2 text-right border-r border-slate-700 font-mono">
                    {fmt(totals.op)}
                  </td>
                  <td className="p-2 border-r border-slate-700"></td>
                  <td className="p-2 text-right border-r border-slate-700 font-mono text-emerald-400">
                    {fmt(totals.in)}
                  </td>
                  <td className="p-2 border-r border-slate-700"></td>
                  <td className="p-2 border-r border-slate-700"></td>
                  <td className="p-2 text-right font-mono text-indigo-300 text-sm">
                    ₹ {fmt(totals.cl)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
