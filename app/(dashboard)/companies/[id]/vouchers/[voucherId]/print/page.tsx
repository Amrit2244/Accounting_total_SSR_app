import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintTriggerButton from "@/components/PrintTriggerButton";
import { IndianRupee } from "lucide-react";

export default async function PrintVoucherPage({
  params,
}: {
  params: Promise<{ id: string; voucherId: string }>;
}) {
  const { id, voucherId } = await params;
  const vId = parseInt(voucherId);

  // 1. Fetch Voucher Details with all necessary relations
  const voucher = await prisma.voucher.findUnique({
    where: { id: vId },
    include: {
      company: true,
      entries: { include: { ledger: true } },
      inventory: {
        include: {
          stockItem: {
            include: { unit: true },
          },
        },
      },
      createdBy: true, // ✅ Included for Audit Trail
      verifiedBy: true, // ✅ Included for Audit Trail
    },
  });

  if (!voucher) return notFound();

  // 2. Logic to determine Grand Total
  const isStockJournal = voucher.type === "STOCK_JOURNAL";
  let grandTotal = 0;

  if (isStockJournal) {
    const productionTotal = voucher.inventory
      .filter((i) => i.isProduction === true)
      .reduce((sum, i) => sum + i.amount, 0);

    grandTotal =
      productionTotal > 0
        ? productionTotal
        : voucher.inventory.reduce((sum, i) => sum + i.amount, 0) / 2;
  } else {
    grandTotal = voucher.entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // Helper: Find Primary Party for the header
  const primaryParty =
    voucher.entries.find(
      (e) =>
        !e.ledger.name.toLowerCase().includes("cash") &&
        !e.ledger.name.toLowerCase().includes("bank") &&
        Math.abs(e.amount) > 0
    )?.ledger.name || "Cash / Counterparty";

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isInventory = voucher.inventory.length > 0;

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center p-8 print:p-0 print:bg-white">
      <div className="fixed top-6 right-6 no-print z-50">
        <PrintTriggerButton />
      </div>

      <div
        id="printable-area"
        className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl text-slate-900 print:shadow-none print:w-full print:p-8"
      >
        {/* 1. HEADER SECTION */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wide text-slate-900">
              {voucher.company.name}
            </h1>
            <div className="text-sm mt-2 text-slate-600 whitespace-pre-line leading-relaxed max-w-[400px]">
              {voucher.company.address || "Address Not Provided"}
            </div>
            <div className="text-sm mt-3 font-bold bg-slate-100 inline-block px-2 py-1 rounded">
              GSTIN: {voucher.company.gstin || "N/A"}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-4xl font-black uppercase text-slate-200 leading-none mb-4">
              {voucher.type.replace("_", " ")}
            </h2>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Voucher No.
              </p>
              <p className="text-xl font-black font-mono">
                {voucher.voucherNo}
              </p>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pt-2">
                Date
              </p>
              <p className="text-lg font-bold">{fmtDate(voucher.date)}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pt-2">
                Reference ID
              </p>
              <p className="text-sm font-mono text-slate-600">
                {voucher.transactionCode}
              </p>
            </div>
          </div>
        </div>

        {/* 2. PARTY / NARRATION BLOCK */}
        <div className="mb-8">
          {isStockJournal ? (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">
                Process Narration:
              </p>
              <p className="text-sm font-bold text-blue-900 italic">
                "{voucher.narration || "Stock transfer/manufacturing record"}"
              </p>
            </div>
          ) : isInventory ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-2/3">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                Account Particulars:
              </p>
              <p className="text-xl font-black text-slate-900">
                {primaryParty}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                Narration:
              </p>
              <p className="text-sm font-medium italic text-slate-700 border-b border-dashed border-slate-300 pb-2">
                "
                {voucher.narration || "Being amount recorded as per details..."}
                "
              </p>
            </div>
          )}
        </div>

        {/* 3. MAIN CONTENT TABLE */}
        {isInventory ? (
          <table className="w-full mb-8 border-collapse">
            <thead className="bg-slate-900 text-white print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-3 text-left text-xs uppercase tracking-widest">
                  Item Description
                </th>
                <th className="p-3 text-right text-xs uppercase tracking-widest w-24">
                  Qty
                </th>
                <th className="p-3 text-center text-xs uppercase tracking-widest w-20">
                  Unit
                </th>
                <th className="p-3 text-right text-xs uppercase tracking-widest w-32">
                  Rate
                </th>
                <th className="p-3 text-right text-xs uppercase tracking-widest w-40">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 border-b-2 border-slate-900">
              {voucher.inventory.map((item, idx) => (
                <tr
                  key={idx}
                  className={
                    isStockJournal && item.isProduction
                      ? "bg-emerald-50/30 print:bg-transparent"
                      : ""
                  }
                >
                  <td className="p-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      {item.stockItem?.name || item.itemName}
                      {isStockJournal && (
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                            item.isProduction
                              ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                              : "bg-orange-100 border-orange-200 text-orange-700"
                          }`}
                        >
                          {item.isProduction ? "IN" : "OUT"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono">
                    {Math.abs(item.quantity)}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-500 font-bold">
                    {item.stockItem?.unit?.symbol || "NOS"}
                  </td>
                  <td className="p-4 text-right font-mono">{fmt(item.rate)}</td>
                  <td className="p-4 text-right font-black font-mono text-slate-900">
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full mb-8 border-collapse">
            <thead className="bg-slate-100 text-slate-800 border-y-2 border-slate-900">
              <tr>
                <th className="p-3 text-left text-xs uppercase tracking-widest">
                  Ledger Account
                </th>
                <th className="p-3 text-right text-xs uppercase tracking-widest w-44">
                  Debit
                </th>
                <th className="p-3 text-right text-xs uppercase tracking-widest w-44">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 border-b-2 border-slate-900">
              {voucher.entries.map((entry, idx) => (
                <tr key={idx}>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 uppercase">
                      {entry.ledger.name}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold">
                    {entry.amount > 0 ? fmt(entry.amount) : ""}
                  </td>
                  <td className="p-4 text-right font-mono font-bold">
                    {entry.amount < 0 ? fmt(Math.abs(entry.amount)) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 4. TOTALS SECTION */}
        <div className="flex justify-end mb-16">
          <div className="bg-slate-900 text-white p-6 w-80 rounded-2xl shadow-xl print:bg-slate-100 print:text-black print:border-2 print:border-black">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">
              Grand Total
            </p>
            <p className="text-4xl font-black tracking-tight flex items-center justify-end">
              <IndianRupee
                size={28}
                className="mr-2 text-blue-400 print:text-black"
              />
              {fmt(Math.abs(grandTotal))}
            </p>
          </div>
        </div>

        {/* ✅ FEATURE 5: AUDIT TRAIL SECTION */}
        <div className="mt-12 pt-8 border-t border-slate-100 space-y-3 no-print-background">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Voucher Audit Trail
          </h4>
          <div className="flex items-center gap-8 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Maker:</span>{" "}
              {voucher.createdBy?.name || "System"}
              <span className="text-slate-400 italic">
                ({new Date(voucher.createdAt).toLocaleString("en-IN")})
              </span>
            </div>
            {voucher.verifiedBy && (
              <div className="flex items-center gap-2 border-l pl-8 border-slate-200">
                <span className="font-bold text-emerald-600">Verified By:</span>{" "}
                {voucher.verifiedBy?.name}
                <span className="text-slate-400 italic">
                  ({new Date(voucher.updatedAt).toLocaleString("en-IN")})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. FOOTER SECTION */}
        <div className="grid grid-cols-2 gap-12 border-t border-slate-200 pt-8 mt-12">
          <div className="space-y-4">
            <p className="text-xs font-black uppercase text-slate-900 tracking-widest">
              Terms & Conditions
            </p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4">
              <li>
                This is a computer-generated document and requires no physical
                signature.
              </li>
              <li>Verify all quantities and rates upon receipt.</li>
              <li>
                Subject to{" "}
                {voucher.company.address?.split(",").pop()?.trim() || "Local"}{" "}
                Jurisdiction.
              </li>
            </ul>
          </div>

          <div className="text-right flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                For
              </p>
              <p className="font-black text-slate-900 uppercase text-lg leading-tight">
                {voucher.company.name}
              </p>
            </div>
            <div className="mt-12">
              <div className="inline-block border-t-2 border-slate-900 pt-2 px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
