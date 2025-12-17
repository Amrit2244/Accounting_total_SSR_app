import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintTriggerButton from "@/components/PrintTriggerButton"; // Assuming this button component exists
import { IndianRupee } from "lucide-react"; // Icon for currency

export default async function PrintVoucherPage({
  params,
}: {
  params: Promise<{ id: string; voucherId: string }>;
}) {
  const { id, voucherId } = await params;
  const vId = parseInt(voucherId);

  // 1. Fetch Voucher Details
  const voucher = await prisma.voucher.findUnique({
    where: { id: vId },
    include: {
      company: true,
      entries: { include: { ledger: true } },
      inventory: { include: { item: { include: { unit: true } } } }, // Include unit for inventory
      createdBy: true,
    },
  });

  if (!voucher) return notFound();

  // Helper: Calculate Total Amount (Filter debit entries for total)
  const totalAmount = voucher.entries
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const isInventory = voucher.inventory.length > 0;

  // Helper: Find Primary Party/Account (often the first non-cash/bank entry)
  const primaryParty =
    voucher.entries.find(
      (e) =>
        !e.ledger.name.toLowerCase().includes("cash") &&
        !e.ledger.name.toLowerCase().includes("bank") &&
        Math.abs(e.amount) > 0 // Ensure it's not a zero-value entry
    )?.ledger.name || "Cash / Counterparty";

  // Helper: Number Formatting
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // Helper: Date Formatting
  const fmtDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center p-8 print:p-0 print:bg-white">
      {/* --- PRINT BUTTONS (Floating Top Right - Hidden on Print) --- */}
      <div className="fixed top-6 right-6 no-print z-50">
        <PrintTriggerButton />
      </div>

      {/* --- A4 PAPER CONTAINER (ID="printable-area" is the key!) --- */}
      <div
        id="printable-area"
        className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl text-slate-900 print:shadow-none print:w-full print:p-8"
      >
        {/* 1. HEADER SECTION */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wide text-slate-900">
              {voucher.company.name}
            </h1>
            <div className="text-sm mt-2 text-slate-600 whitespace-pre-line leading-relaxed max-w-[300px]">
              {voucher.company.address || "Address Not Provided"}
            </div>
            <div className="text-sm mt-3 font-bold">
              GSTIN: {voucher.company.gstin || "N/A"}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-4xl font-black uppercase text-slate-300">
              {voucher.type}
            </h2>
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Voucher No.
              </p>
              <p className="text-xl font-bold font-mono text-slate-900">
                {voucher.voucherNo}
              </p>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Date
              </p>
              <p className="text-lg font-bold">{fmtDate(voucher.date)}</p>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Txn Code
              </p>
              <p className="text-sm font-mono text-slate-600">
                {voucher.transactionCode}
              </p>
            </div>
          </div>
        </div>

        {/* 2. PARTY / NARRATION BLOCK */}
        <div className="mb-8 flex justify-between items-end">
          {isInventory ? (
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg w-1/2 print:border-gray-500 print:bg-white">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                Bill To Party:
              </p>
              <p className="text-lg font-black text-slate-900">
                {primaryParty}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                Narration / Particulars:
              </p>
              <p className="text-sm font-medium italic text-slate-700 border-b border-dashed border-slate-300 pb-1">
                "{voucher.narration || "Being amount recorded..."}"
              </p>
            </div>
          )}
        </div>

        {/* 3. MAIN TABLE */}
        {isInventory ? (
          /* --- INVENTORY TABLE (Sales/Purchase) --- */
          <table className="w-full mb-8 border border-slate-900 print:border-black">
            <thead className="bg-slate-800 text-white print:bg-slate-200 print:text-black text-xs uppercase font-bold">
              <tr>
                <th className="p-3 text-left border-r border-slate-500 print:border-gray-500">
                  Item Description
                </th>
                <th className="p-3 text-right border-r border-slate-500 print:border-gray-500 w-24">
                  Qty
                </th>
                <th className="p-3 text-center border-r border-slate-500 print:border-gray-500 w-20">
                  Unit
                </th>
                <th className="p-3 text-right border-r border-slate-500 print:border-gray-500 w-32">
                  Rate
                </th>
                <th className="p-3 text-right w-40">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-300 print:divide-gray-500">
              {voucher.inventory.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold text-slate-700 border-r border-slate-300 print:border-gray-300">
                    {item.item?.name || `Item #${item.itemId}`}
                  </td>
                  <td className="p-3 text-right border-r border-slate-300 print:border-gray-300 font-mono">
                    {Math.abs(item.quantity)}
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 print:border-gray-300 text-xs text-slate-600">
                    {item.item?.unit?.symbol || "NOS"}
                  </td>
                  <td className="p-3 text-right border-r border-slate-300 print:border-gray-300 font-mono">
                    {fmt(item.rate)}
                  </td>
                  <td className="p-3 text-right font-bold font-mono text-slate-900">
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
              {/* Empty rows to fill space visually */}
              <tr className="h-32">
                <td
                  colSpan={5}
                  className="border-t border-slate-200 print:border-gray-300"
                ></td>
              </tr>
            </tbody>
          </table>
        ) : (
          /* --- ACCOUNTING TABLE (Journal/Payment) --- */
          <table className="w-full mb-8 border-2 border-slate-800 print:border-black">
            <thead className="bg-slate-100 text-slate-800 text-xs uppercase font-bold border-b-2 border-slate-800 print:border-black print:bg-slate-100">
              <tr>
                <th className="p-3 text-left border-r border-slate-400 print:border-gray-500">
                  Ledger Account
                </th>
                <th className="p-3 text-right w-40 border-r border-slate-400 print:border-gray-500">
                  Debit
                </th>
                <th className="p-3 text-right w-40">Credit</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 print:divide-gray-500">
              {voucher.entries.map((entry, idx) => (
                <tr key={idx}>
                  <td className="p-3 border-r border-slate-300 print:border-gray-300">
                    <span className="font-bold text-slate-800">
                      {entry.ledger.name}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono border-r border-slate-300 print:border-gray-300">
                    {entry.amount > 0 ? fmt(entry.amount) : ""}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {entry.amount < 0 ? fmt(Math.abs(entry.amount)) : ""}
                  </td>
                </tr>
              ))}
              <tr className="h-24">
                <td
                  colSpan={3}
                  className="border-t border-slate-200 print:border-gray-300"
                ></td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 4. TOTALS SECTION */}
        <div className="flex justify-end mb-20">
          <div className="bg-slate-800 text-white border-2 border-slate-900 p-4 w-64 print:border-black print:bg-slate-100 print:text-black">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 print:text-slate-600">
              Grand Total
            </p>
            <p className="text-3xl font-black tracking-tight flex items-center justify-end print:text-black">
              <IndianRupee size={24} className="mr-1" />{" "}
              {fmt(Math.abs(totalAmount))}
            </p>
          </div>
        </div>

        {/* 5. FOOTER / SIGNATURES */}
        <div className="grid grid-cols-2 gap-10 border-t-2 border-slate-800 pt-6 page-break-inside-avoid print:border-black">
          <div>
            <p className="text-xs font-bold uppercase text-slate-800 mb-2">
              Terms & Conditions:
            </p>
            <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
              <li>This document is a computer generated copy.</li>
              <li>E. & O.E. (Errors and Omissions Excepted).</li>
              <li>
                Disputes subject to{" "}
                {voucher.company.address.split("\n").pop() || "local"}{" "}
                jurisdiction.
              </li>
            </ul>
          </div>
          <div className="text-right relative">
            <p className="font-bold text-slate-800 mb-12">
              For {voucher.company.name}
            </p>
            <p className="text-xs border-t border-slate-400 inline-block px-12 pt-2 uppercase font-bold text-slate-500">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
