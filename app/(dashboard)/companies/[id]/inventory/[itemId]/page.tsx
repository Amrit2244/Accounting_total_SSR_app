import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function StockItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const companyId = parseInt(id);
  const sItemId = parseInt(itemId);

  // 1. Fetch the basic Stock Item details
  const item = await prisma.stockItem.findUnique({
    where: { id: sItemId },
    include: {
      unit: true,
      group: true,
    },
  });

  if (!item || item.companyId !== companyId) {
    return notFound();
  }

  // 2. Fetch Item Movements from all 3 possible tables
  const [salesEntries, purchaseEntries, journalEntries] = await Promise.all([
    prisma.salesItemEntry.findMany({
      where: { stockItemId: sItemId, salesVoucher: { status: "APPROVED" } },
      include: { salesVoucher: true },
    }),
    prisma.purchaseItemEntry.findMany({
      where: { stockItemId: sItemId, purchaseVoucher: { status: "APPROVED" } },
      include: { purchaseVoucher: true },
    }),
    prisma.stockJournalEntry.findMany({
      where: { stockItemId: sItemId, stockJournal: { status: "APPROVED" } },
      include: { stockJournal: true },
    }),
  ]);

  // 3. Unify and sort the movements (Passbook style)
  // ✅ Added explicit : any types for the cloud build
  const movements = [
    ...salesEntries.map((e: any) => ({
      id: `sales-${e.id}`,
      date: e.salesVoucher.date,
      type: "SALES",
      voucherNo: e.salesVoucher.voucherNo,
      qtyIn: 0,
      qtyOut: Math.abs(e.quantity),
      rate: e.rate,
    })),
    ...purchaseEntries.map((e: any) => ({
      id: `purchase-${e.id}`,
      date: e.purchaseVoucher.date,
      type: "PURCHASE",
      voucherNo: e.purchaseVoucher.voucherNo,
      qtyIn: Math.abs(e.quantity),
      qtyOut: 0,
      rate: e.rate,
    })),
    ...journalEntries.map((e: any) => ({
      id: `journal-${e.id}`,
      date: e.stockJournal.date,
      type: "STOCK JOURNAL",
      voucherNo: e.stockJournal.voucherNo,
      qtyIn: e.quantity > 0 ? e.quantity : 0,
      qtyOut: e.quantity < 0 ? Math.abs(e.quantity) : 0,
      rate: e.rate,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate Running Stock
  let runningStock = item.openingQty;
  const history = movements.map((m: any) => {
    runningStock = runningStock + m.qtyIn - m.qtyOut;
    return { ...m, balance: runningStock };
  });

  return (
    <div className="p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">
            {item.name}
          </h1>
          <p className="text-slate-500 text-sm">
            Part No: {item.partNumber || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 uppercase block">
            Current Stock
          </span>
          <span className="text-3xl font-black text-blue-600">
            {runningStock}{" "}
            <small className="text-sm text-slate-400 uppercase">
              {item.unit?.symbol}
            </small>
          </span>
        </div>
      </div>

      {/* LEDGER / PASSBOOK TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Type</th>
              <th className="p-4">Vch No</th>
              <th className="p-4 text-right">Inward</th>
              <th className="p-4 text-right">Outward</th>
              <th className="p-4 text-right">Rate</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="bg-yellow-50/50 font-bold">
              <td colSpan={6} className="p-4 text-right text-[10px] uppercase">
                Opening Balance
              </td>
              <td className="p-4 text-right">{item.openingQty}</td>
            </tr>
            {history.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  {format(new Date(row.date), "dd MMM yyyy")}
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-white shadow-sm uppercase">
                    {row.type}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-500">
                  {row.voucherNo}
                </td>
                <td className="p-4 text-right text-emerald-600 font-bold">
                  {row.qtyIn || ""}
                </td>
                <td className="p-4 text-right text-rose-600 font-bold">
                  {row.qtyOut || ""}
                </td>
                <td className="p-4 text-right text-slate-400">
                  ₹{row.rate.toFixed(2)}
                </td>
                <td className="p-4 text-right font-black text-slate-900">
                  {row.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
