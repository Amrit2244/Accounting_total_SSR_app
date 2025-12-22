import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintTriggerButton from "@/components/PrintTriggerButton";
import { IndianRupee } from "lucide-react";

// --- FETCH HELPER (Same logic as Details Page) ---
async function getVoucherForPrint(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };

  // Relations needed for printing
  const rel = {
    company: true,
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
    inventoryEntries: { include: { stockItem: { include: { unit: true } } } },
    createdBy: true,
    verifiedBy: true,
  };

  // Adjust for specific tables
  switch (t) {
    case "SALES":
      return prisma.salesVoucher.findUnique({ where, include: rel });
    case "PURCHASE":
      return prisma.purchaseVoucher.findUnique({ where, include: rel });
    case "PAYMENT":
      return prisma.paymentVoucher.findUnique({
        where,
        include: { ...rel, inventoryEntries: false },
      }); // Payment has no inventory
    case "RECEIPT":
      return prisma.receiptVoucher.findUnique({
        where,
        include: { ...rel, inventoryEntries: false },
      });
    case "CONTRA":
      return prisma.contraVoucher.findUnique({
        where,
        include: { ...rel, inventoryEntries: false },
      });
    case "JOURNAL":
      return prisma.journalVoucher.findUnique({
        where,
        include: { ...rel, inventoryEntries: false },
      });
    case "STOCK_JOURNAL":
      return prisma.stockJournal.findUnique({ where, include: rel }); // Stock Journal has inventory
    default:
      return null;
  }
}

export default async function PrintVoucherPage({
  params,
}: {
  params: Promise<{ id: string; type: string; voucherId: string }>;
}) {
  const { id, type, voucherId } = await params;

  const companyId = parseInt(id);
  const vId = parseInt(voucherId);

  // ✅ Fetch from correct table
  const voucher: any = await getVoucherForPrint(companyId, type, vId);

  if (!voucher) return notFound();

  const isStockJournal = type.toUpperCase() === "STOCK_JOURNAL";
  let grandTotal = voucher.totalAmount || 0;

  // Use the correct field names from your schema
  // Your schema uses 'ledgerEntries' and 'inventoryEntries'
  const entries = voucher.ledgerEntries || [];
  const inventory = voucher.inventoryEntries || [];

  // Helper formatting functions
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const fmtDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isInventory = inventory.length > 0;

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center p-4 print:p-0 print:bg-white font-sans">
      <div className="fixed top-4 right-4 no-print z-50">
        <PrintTriggerButton />
      </div>

      <div
        id="printable-area"
        className="w-[210mm] min-h-[297mm] bg-white p-8 shadow-xl text-slate-900 print:shadow-none print:w-full"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
              {voucher.company?.name || "Company Name"}
            </h1>
            <div className="text-xs mt-1 text-slate-600 whitespace-pre-line leading-snug max-w-[350px]">
              {voucher.company?.address || "Address Not Provided"}
            </div>
            <div className="text-[10px] mt-2 font-bold bg-slate-100 inline-block px-1.5 py-0.5 rounded">
              GSTIN: {voucher.company?.gstin || "N/A"}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase text-slate-300 leading-none mb-2">
              {type.replace("_", " ")}
            </h2>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-500">
                Voucher No:{" "}
                <span className="text-slate-900 font-mono text-sm">
                  {voucher.voucherNo}
                </span>
              </p>
              <p className="font-bold text-slate-500">
                Date:{" "}
                <span className="text-slate-900">{fmtDate(voucher.date)}</span>
              </p>
              <p className="font-mono text-[10px] text-slate-400">
                TX: {voucher.transactionCode}
              </p>
            </div>
          </div>
        </div>

        {/* NARRATION */}
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700">
          <span className="font-bold not-italic text-slate-500 uppercase mr-2 text-[10px]">
            Narration:
          </span>
          {voucher.narration || "Being transaction recorded..."}
        </div>

        {/* INVENTORY TABLE */}
        {isInventory ? (
          <table className="w-full mb-6 border-collapse text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2 text-left uppercase tracking-widest font-bold">
                  Item Description
                </th>
                <th className="p-2 text-right uppercase tracking-widest w-20 font-bold">
                  Qty
                </th>
                <th className="p-2 text-center uppercase tracking-widest w-16 font-bold">
                  Unit
                </th>
                <th className="p-2 text-right uppercase tracking-widest w-24 font-bold">
                  Rate
                </th>
                <th className="p-2 text-right uppercase tracking-widest w-32 font-bold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
              {inventory.map((item: any, idx: number) => (
                <tr
                  key={idx}
                  className={
                    isStockJournal && item.quantity > 0 // Check quantity for Stock Jrnl logic (In/Out)
                      ? "bg-emerald-50/50 print:bg-transparent"
                      : ""
                  }
                >
                  <td className="p-2 font-bold text-slate-800 flex items-center gap-2">
                    {item.stockItem?.name || item.itemName}
                    {isStockJournal && (
                      <span
                        className={`text-[8px] font-black px-1 rounded border ${
                          item.quantity > 0
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                            : "bg-orange-100 border-orange-200 text-orange-700"
                        }`}
                      >
                        {item.quantity > 0 ? "IN" : "OUT"}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {Math.abs(item.quantity)}
                  </td>
                  <td className="p-2 text-center text-[10px] text-slate-500 font-bold">
                    {item.stockItem?.unit?.symbol || "NOS"}
                  </td>
                  <td className="p-2 text-right font-mono">{fmt(item.rate)}</td>
                  <td className="p-2 text-right font-black font-mono text-slate-900">
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full mb-6 border-collapse text-xs">
            <thead className="bg-slate-100 border-y-2 border-slate-900">
              <tr>
                <th className="p-2 text-left uppercase font-bold">
                  Ledger Account
                </th>
                <th className="p-2 text-right uppercase font-bold w-32">
                  Debit
                </th>
                <th className="p-2 text-right uppercase font-bold w-32">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
              {entries.map((entry: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2 font-bold text-slate-800">
                    {entry.ledger?.name || "Unknown Ledger"}
                    <span className="block text-[9px] text-slate-400 font-black uppercase">
                      {entry.ledger?.group?.name || ""}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono font-bold">
                    {entry.amount > 0 ? fmt(entry.amount) : ""}
                  </td>
                  <td className="p-2 text-right font-mono font-bold">
                    {entry.amount < 0 ? fmt(Math.abs(entry.amount)) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* TOTALS */}
        <div className="flex justify-end mb-8">
          <div className="bg-slate-900 text-white p-4 w-64 rounded-xl shadow-lg print:border-2 print:border-black print:bg-white print:text-black">
            <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest print:text-slate-600">
              Grand Total
            </p>
            <p className="text-2xl font-black flex items-center justify-end">
              <IndianRupee size={18} className="mr-1" />
              {fmt(Math.abs(grandTotal))}
            </p>
          </div>
        </div>

        {/* AUDIT TRAIL & FOOTER */}
        <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-[10px]">
          <div>
            <p className="font-bold text-slate-900 uppercase mb-2">Audit Log</p>
            <p>
              Maker:{" "}
              <span className="font-bold">
                {voucher.createdBy?.name || "System"}
              </span>
            </p>
            {voucher.verifiedBy && (
              <p>
                Verifier:{" "}
                <span className="font-bold text-emerald-600">
                  {voucher.verifiedBy.name}
                </span>
              </p>
            )}
          </div>
          <div className="text-right flex flex-col justify-between h-20">
            <p className="font-bold uppercase">For {voucher.company?.name}</p>
            <p className="font-black uppercase tracking-widest border-t border-slate-900 inline-block pt-1">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
``;
