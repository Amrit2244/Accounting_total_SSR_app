import { prisma } from "@/lib/prisma";
import { Hash } from "lucide-react";

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

export default async function LedgerPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const companyId = parseInt(resolvedParams.id);
  const { ledgerId, from, to } = resolvedSearchParams;

  if (!ledgerId)
    return (
      <div className="p-10 text-center uppercase font-bold">
        No Ledger Selected
      </div>
    );

  const today = new Date();
  const currentYear =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fromStr = from || `${currentYear}-04-01`;
  const toStr = to || today.toISOString().split("T")[0];

  const fromISO = new Date(fromStr);
  const toISO = new Date(toStr);

  // Prisma needs Date objects, but let's be safe
  if (isNaN(fromISO.getTime()) || isNaN(toISO.getTime())) {
    return (
      <div className="p-10 text-center font-bold text-red-600">
        Error: Invalid Date range provided.
      </div>
    );
  }

  const lid = parseInt(ledgerId);
  const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!ledger) return <div className="p-10 text-center">Ledger not found.</div>;

  // 1. Opening Balance Logic
  const prevEntries = await prisma.voucherEntry.findMany({
    where: {
      ledgerId: lid,
      voucher: { date: { lt: fromISO }, status: "APPROVED" },
    },
  });
  const prevDr = prevEntries
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const prevCr = prevEntries
    .filter((e) => e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const openingBalance = (ledger.openingBalance || 0) + (prevDr - prevCr);

  // 2. Main entries logic with corrected Date nesting
  const entries = await prisma.voucherEntry.findMany({
    where: {
      ledgerId: lid,
      voucher: {
        date: { gte: fromISO, lte: toISO },
        status: "APPROVED",
      },
    },
    include: {
      voucher: {
        include: {
          entries: {
            include: { ledger: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { voucher: { date: "asc" } },
  });

  let runningBalance = openingBalance;

  return (
    <div className="bg-white p-10 min-h-screen text-black font-sans leading-tight">
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.onload = () => { window.print(); window.onafterprint = () => window.close(); }",
        }}
      />

      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {company?.name || "Official Statement"}
          </h1>
          <p className="text-lg font-bold text-gray-700 uppercase mt-1">
            Ledger: {ledger.name}
          </p>
        </div>
        <div className="text-right text-sm font-bold uppercase">
          <p className="bg-black text-white px-2 py-1 inline-block mb-2">
            Statement of Account
          </p>
          <p>
            {fmtDate(fromISO)} to {fmtDate(toISO)}
          </p>
        </div>
      </div>

      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left font-bold uppercase text-[10px]">
            <th className="py-2">Date</th>
            <th className="py-2">TXID</th>
            <th className="py-2 w-40">Particulars</th>
            <th className="py-2">Party / Account</th>
            <th className="py-2 text-right">Debit</th>
            <th className="py-2 text-right">Credit</th>
            <th className="py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          <tr className="font-bold italic bg-gray-50">
            <td className="py-3">—</td>
            <td className="py-3">—</td>
            <td className="py-3 uppercase text-gray-500" colSpan={2}>
              Opening Balance B/F
            </td>
            <td className="py-3 text-right">
              {openingBalance > 0 ? fmt(openingBalance) : ""}
            </td>
            <td className="py-3 text-right">
              {openingBalance < 0 ? fmt(Math.abs(openingBalance)) : ""}
            </td>
            <td className="py-3 text-right font-black">
              {fmt(Math.abs(openingBalance))}{" "}
              {openingBalance >= 0 ? "Dr" : "Cr"}
            </td>
          </tr>

          {entries.map((entry) => {
            runningBalance += entry.amount;
            const partyLedger = entry.voucher.entries.find((vch: any) =>
              entry.amount > 0 ? vch.amount < 0 : vch.amount > 0
            );

            return (
              <tr key={entry.id} className="break-inside-avoid">
                <td className="py-3 align-top font-bold">
                  {fmtDate(entry.voucher.date)}
                </td>
                <td className="py-3 align-top font-mono font-bold text-gray-500">
                  {entry.voucher.transactionCode}
                </td>
                <td className="py-3 align-top pr-4 w-40">
                  <div className="text-[9px] text-gray-600 italic leading-tight mb-1">
                    {entry.voucher.narration || "Entry Post"}
                  </div>
                  <div className="font-black text-[8px] uppercase text-gray-400">
                    Vch: {entry.voucher.type} #{entry.voucher.voucherNo}
                  </div>
                </td>
                <td className="py-3 align-top font-bold text-gray-800 uppercase text-[9px]">
                  {partyLedger?.ledger?.name || "Multiple Accounts"}
                </td>
                <td className="py-3 text-right align-top font-mono font-bold text-red-700">
                  {entry.amount > 0 ? fmt(entry.amount) : ""}
                </td>
                <td className="py-3 text-right align-top font-mono font-bold text-emerald-700">
                  {entry.amount < 0 ? fmt(Math.abs(entry.amount)) : ""}
                </td>
                <td className="py-3 text-right align-top font-mono font-black text-[11px]">
                  {fmt(Math.abs(runningBalance))}{" "}
                  <span className="text-[8px] text-gray-400 font-bold">
                    {runningBalance >= 0 ? "DR" : "CR"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-4 border-black font-black bg-gray-50">
            <td
              colSpan={4}
              className="py-4 text-right pr-6 uppercase tracking-widest text-[10px]"
            >
              Net Statement Balance
            </td>
            <td colSpan={3} className="py-4 text-right text-lg font-mono">
              {fmt(Math.abs(runningBalance))}{" "}
              {runningBalance >= 0 ? "DR" : "CR"}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <span>Accounting Ledger Report • Audit Copy</span>
        <span>{new Date().toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
