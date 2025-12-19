import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import PrintButton from "@/components/PrintButton";
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

export default async function StockItemRegisterPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const companyId = parseInt(id);
  const sItemId = parseInt(itemId);

  if (isNaN(companyId) || isNaN(sItemId)) notFound();

  // 1. Fetch Item Details & Transactions
  const stockItem = await prisma.stockItem.findUnique({
    where: { id: sItemId },
    include: {
      unit: true,
      inventoryEntries: {
        where: { voucher: { status: "APPROVED" } }, // Only approved txns
        include: {
          voucher: {
            include: {
              entries: {
                include: { ledger: true },
              },
            },
          },
        },
        orderBy: { voucher: { date: "asc" } },
      },
    },
  });

  if (!stockItem) notFound();

  // 2. Process Data for Running Balance
  // Start with Opening Balance
  let runningQty = stockItem.openingQty || 0;
  let runningVal =
    stockItem.openingValue ||
    (stockItem.openingQty || 0) * (stockItem.openingRate || 0);

  // Flatten transactions
  const transactions = stockItem.inventoryEntries.map((entry) => {
    const v = entry.voucher;

    // Find "Particulars" (The Party Name)
    const partyEntry = v.entries.find(
      (e) =>
        !e.ledger.name.toLowerCase().includes("gst") &&
        !e.ledger.name.toLowerCase().includes("sales") &&
        !e.ledger.name.toLowerCase().includes("purchase")
    );
    const particulars = partyEntry
      ? partyEntry.ledger.name
      : "Cash / Adjustment";

    const qty = Math.abs(entry.quantity); // Always work with positive magnitude
    const amount = Math.abs(entry.amount);
    const rate = qty !== 0 ? amount / qty : 0;

    // ✅ FIX: Normalize Type to UpperCase for reliable checking
    const type = v.type.toUpperCase();

    let isInward = false;

    if (type === "SALES") {
      isInward = false; // Sales = Outward
    } else if (type === "PURCHASE") {
      isInward = true; // Purchase = Inward
    } else if (type === "CREDIT_NOTE") {
      isInward = true; // Sales Return = Inward
    } else if (type === "DEBIT_NOTE") {
      isInward = false; // Purchase Return = Outward
    } else {
      // Fallback: If quantity stored in DB is positive, treat as Inward
      isInward = entry.quantity > 0;
    }

    // Update Running Balance
    if (isInward) {
      runningQty += qty;
      runningVal += amount;
    } else {
      runningQty -= qty;
      // For outward, reduce value based on weighted average
      const currentRate =
        runningQty !== 0 ? runningVal / (runningQty + qty) : 0;
      runningVal = runningQty <= 0 ? 0 : runningVal - qty * currentRate;
    }

    // Calculate Closing Rate
    const closingRate = runningQty > 0 ? runningVal / runningQty : 0;

    return {
      id: entry.id,
      date: v.date,
      vchNo: v.voucherNo,
      vchType: v.type, // Display original type name
      particulars,
      inward: isInward ? { qty, rate, amount } : null,
      outward: !isInward ? { qty, rate, amount } : null,
      closing: { qty: runningQty, rate: closingRate, amount: runningVal },
    };
  });

  // Calculate Column Totals
  const totalInwardQty = transactions.reduce(
    (s, t) => s + (t.inward?.qty || 0),
    0
  );
  const totalOutwardQty = transactions.reduce(
    (s, t) => s + (t.outward?.qty || 0),
    0
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 py-6 font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <Package size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Stock Voucher Register
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              Item: <span className="text-blue-600">{stockItem.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Link
            href={`/companies/${companyId}/inventory`}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* TABLE HEADER */}
        <div className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center shrink-0 border-b border-slate-800">
          <div className="w-24 p-3 border-r border-slate-700">Date</div>
          <div className="flex-1 p-3 border-r border-slate-700">
            Particulars
          </div>
          <div className="w-24 p-3 border-r border-slate-700">Vch Type</div>
          <div className="w-20 p-3 border-r border-slate-700">Vch No</div>

          {/* INWARD GROUP */}
          <div className="w-[180px] flex flex-col border-r border-slate-700">
            <div className="p-1 text-center border-b border-slate-700 bg-emerald-900/50">
              Inwards
            </div>
            <div className="flex">
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Qty
              </div>
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Rate
              </div>
              <div className="flex-1 p-2 text-right">Value</div>
            </div>
          </div>

          {/* OUTWARD GROUP */}
          <div className="w-[180px] flex flex-col border-r border-slate-700">
            <div className="p-1 text-center border-b border-slate-700 bg-rose-900/50">
              Outwards
            </div>
            <div className="flex">
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Qty
              </div>
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Rate
              </div>
              <div className="flex-1 p-2 text-right">Value</div>
            </div>
          </div>

          {/* CLOSING GROUP */}
          <div className="w-[180px] flex flex-col">
            <div className="p-1 text-center border-b border-slate-700 bg-slate-800">
              Closing Balance
            </div>
            <div className="flex">
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Qty
              </div>
              <div className="w-16 p-2 text-right border-r border-slate-700">
                Rate
              </div>
              <div className="flex-1 p-2 text-right">Value</div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {/* OPENING BALANCE ROW */}
          {(stockItem.openingQty || 0) > 0 && (
            <div className="flex items-center text-[10px] border-b border-slate-200 bg-yellow-50/50 font-bold text-slate-600">
              <div className="w-24 p-2 px-3 border-r border-slate-200 italic">
                Opening
              </div>
              <div className="flex-1 p-2 px-3 border-r border-slate-200 italic">
                Opening Stock
              </div>
              <div className="w-24 border-r border-slate-200"></div>
              <div className="w-20 border-r border-slate-200"></div>

              <div className="w-[180px] border-r border-slate-200"></div>
              <div className="w-[180px] border-r border-slate-200"></div>

              <div className="w-[180px] flex font-mono text-slate-800">
                <div className="w-16 p-2 text-right border-r border-slate-200">
                  {fmtQty(stockItem.openingQty || 0)}
                </div>
                <div className="w-16 p-2 text-right border-r border-slate-200">
                  {fmt(stockItem.openingRate || 0)}
                </div>
                <div className="flex-1 p-2 text-right">
                  {fmt(
                    (stockItem.openingQty || 0) * (stockItem.openingRate || 0)
                  )}
                </div>
              </div>
            </div>
          )}

          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center text-[10px] border-b border-slate-200 hover:bg-blue-50 transition-colors group h-8"
            >
              <div className="w-24 p-1 px-3 border-r border-slate-200 font-bold text-slate-500">
                {new Date(txn.date).toLocaleDateString("en-IN")}
              </div>
              <div className="flex-1 p-1 px-3 border-r border-slate-200 font-bold text-slate-700 uppercase truncate">
                {txn.particulars}
              </div>
              <div className="w-24 p-1 px-3 border-r border-slate-200 font-medium text-slate-400 uppercase text-[9px]">
                {txn.vchType}
              </div>
              <div className="w-20 p-1 px-3 border-r border-slate-200 font-medium text-slate-500">
                {txn.vchNo}
              </div>

              {/* INWARD */}
              <div className="w-[180px] flex font-mono border-r border-slate-200 text-emerald-700 font-bold bg-emerald-50/30">
                <div className="w-16 p-1 text-right border-r border-slate-200">
                  {txn.inward ? fmtQty(txn.inward.qty) : ""}
                </div>
                <div className="w-16 p-1 text-right border-r border-slate-200 text-slate-400 font-normal">
                  {txn.inward ? fmt(txn.inward.rate) : ""}
                </div>
                <div className="flex-1 p-1 text-right">
                  {txn.inward ? fmt(txn.inward.amount) : ""}
                </div>
              </div>

              {/* OUTWARD */}
              <div className="w-[180px] flex font-mono border-r border-slate-200 text-rose-700 font-bold bg-rose-50/30">
                <div className="w-16 p-1 text-right border-r border-slate-200">
                  {txn.outward ? fmtQty(txn.outward.qty) : ""}
                </div>
                <div className="w-16 p-1 text-right border-r border-slate-200 text-slate-400 font-normal">
                  {txn.outward ? fmt(txn.outward.rate) : ""}
                </div>
                <div className="flex-1 p-1 text-right">
                  {txn.outward ? fmt(txn.outward.amount) : ""}
                </div>
              </div>

              {/* CLOSING */}
              <div className="w-[180px] flex font-mono text-slate-900 font-bold bg-slate-50">
                <div className="w-16 p-1 text-right border-r border-slate-200">
                  {fmtQty(txn.closing.qty)}
                </div>
                <div className="w-16 p-1 text-right border-r border-slate-200 text-slate-400 font-normal">
                  {fmt(txn.closing.rate)}
                </div>
                <div className="flex-1 p-1 text-right">
                  {fmt(txn.closing.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL FOOTER */}
        <div className="bg-slate-100 border-t border-slate-300 flex items-center text-[10px] font-black uppercase tracking-tight h-9 shrink-0">
          <div className="w-[calc(96px+100%-480px-244px)] p-2 text-right text-slate-500 pr-4">
            Total
          </div>

          {/* Totals Alignment */}
          <div className="w-[180px] flex border-l border-slate-300">
            <div className="w-16 p-2 text-right border-r border-slate-300 text-emerald-700">
              {fmtQty(totalInwardQty)}
            </div>
            <div className="flex-1"></div>
          </div>
          <div className="w-[180px] flex border-l border-slate-300">
            <div className="w-16 p-2 text-right border-r border-slate-300 text-rose-700">
              {fmtQty(totalOutwardQty)}
            </div>
            <div className="flex-1"></div>
          </div>
          <div className="w-[180px] bg-slate-200 border-l border-slate-300 flex items-center justify-end px-2 text-slate-900">
            {fmtQty(runningQty)} {stockItem.unit.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
