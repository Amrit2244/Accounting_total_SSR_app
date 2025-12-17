import { prisma } from "@/lib/prisma";
import {
  FileText,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  CalendarDays,
  Hash,
} from "lucide-react";
import ReportActionButtons from "@/components/ReportActionButtons";
import LedgerSearchFilter from "@/components/LedgerSearchFilter";

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

export default async function LedgerReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { ledgerId, from, to } = await searchParams;
  const companyId = parseInt(id);

  const today = new Date();
  const currentYear =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const defaultFrom = from || `${currentYear}-04-01`;
  const defaultTo = to || today.toISOString().split("T")[0];

  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let reportData = null;
  let openingBalance = 0;
  let closingBalance = 0;
  let periodTotalDr = 0;
  let periodTotalCr = 0;
  let entries: any[] = [];

  if (ledgerId) {
    const lid = parseInt(ledgerId);
    const fromISO = new Date(`${defaultFrom}T00:00:00.000Z`);
    const toISO = new Date(`${defaultTo}T23:59:59.999Z`);
    const ledger = await prisma.ledger.findUnique({ where: { id: lid } });

    if (ledger) {
      // 1. Calculate Opening Balance
      const prevEntries = await prisma.voucherEntry.findMany({
        where: {
          ledgerId: lid,
          voucher: {
            date: { lt: fromISO },
            status: "APPROVED",
          },
        },
      });
      const prevDr = prevEntries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      const prevCr = prevEntries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      openingBalance = (ledger.openingBalance || 0) + (prevDr - prevCr);

      // 2. Fetch Entries with correct nested Date filter
      entries = await prisma.voucherEntry.findMany({
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

      periodTotalDr = entries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      periodTotalCr = entries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      closingBalance = openingBalance + (periodTotalDr - periodTotalCr);
      reportData = ledger;
    }
  }

  let runningBalance = openingBalance;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans print:hidden">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Ledger Explorer
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Internal Audit & Reporting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LedgerSearchFilter
              companyId={companyId}
              ledgers={ledgers}
              defaultLedgerId={ledgerId}
              defaultFrom={defaultFrom}
              defaultTo={defaultTo}
            />
            <div className="h-8 w-px bg-slate-200 ml-2" />
            <ReportActionButtons />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {reportData ? (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-3 space-y-4 no-print">
              <SummaryTile
                label="Opening Balance"
                amount={openingBalance}
                icon={<ArrowDownLeft size={16} />}
              />
              <SummaryTile
                label="Total Debit"
                amount={periodTotalDr}
                color="text-red-600"
                icon={<ArrowUpRight size={16} />}
              />
              <SummaryTile
                label="Total Credit"
                amount={periodTotalCr}
                color="text-emerald-600"
                icon={<ArrowDownLeft size={16} />}
              />
              <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Net Closing
                </p>
                <p className="text-3xl font-mono font-bold mt-2 truncate">
                  {fmt(Math.abs(closingBalance))}
                </p>
                <p className="text-sm font-medium text-slate-400 mt-1 italic">
                  Balance Type:{" "}
                  {closingBalance >= 0 ? "Debit (Dr)" : "Credit (Cr)"}
                </p>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-10 py-12 border-b border-slate-100 flex justify-between items-end">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Official Statement
                    </span>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                      {reportData.name}
                    </h2>
                  </div>
                  <div className="text-right flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <CalendarDays size={18} />
                    <span>
                      {fmtDate(new Date(defaultFrom))} —{" "}
                      {fmtDate(new Date(defaultTo))}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                        <th className="px-6 py-4 text-left border-b border-slate-100">
                          Date
                        </th>
                        <th className="px-4 py-4 text-left border-b border-slate-100">
                          TXID
                        </th>
                        <th className="px-6 py-4 text-left border-b border-slate-100 w-[180px]">
                          Particulars
                        </th>
                        <th className="px-6 py-4 text-left border-b border-slate-100">
                          Party / Account
                        </th>
                        <th className="px-6 py-4 text-right border-b border-slate-100">
                          Debit
                        </th>
                        <th className="px-6 py-4 text-right border-b border-slate-100">
                          Credit
                        </th>
                        <th className="px-10 py-4 text-right border-b border-slate-100">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="bg-slate-50/30 italic text-xs">
                        <td className="px-6 py-5 text-slate-300 font-mono italic">
                          Start
                        </td>
                        <td className="px-4 py-5 text-slate-300 font-mono">
                          —
                        </td>
                        <td
                          className="px-6 py-5 text-slate-500 font-medium"
                          colSpan={2}
                        >
                          Opening Balance Forwarded
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-slate-400">
                          {openingBalance > 0 ? fmt(openingBalance) : "—"}
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-slate-400">
                          {openingBalance < 0
                            ? fmt(Math.abs(openingBalance))
                            : "—"}
                        </td>
                        <td className="px-10 py-5 text-right font-mono font-bold text-slate-400">
                          {fmt(Math.abs(openingBalance))}{" "}
                          <span className="text-[8px]">
                            {openingBalance >= 0 ? "Dr" : "Cr"}
                          </span>
                        </td>
                      </tr>

                      {entries.map((entry) => {
                        runningBalance += entry.amount;
                        const partyLedger = entry.voucher.entries.find(
                          (vch: any) =>
                            entry.amount > 0 ? vch.amount < 0 : vch.amount > 0
                        );

                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50/80 transition-all duration-200 group"
                          >
                            <td className="px-6 py-4 text-xs text-slate-900 font-bold whitespace-nowrap">
                              {fmtDate(entry.voucher.date)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono text-[9px] font-black uppercase">
                                <Hash size={8} />{" "}
                                {entry.voucher.transactionCode}
                              </div>
                            </td>
                            {/* COMPACT NARRATION */}
                            <td className="px-6 py-4 max-w-[180px]">
                              <div className="text-[10px] text-slate-500 font-medium leading-tight italic line-clamp-2">
                                {entry.voucher.narration || "Entry Post"}
                              </div>
                              <div className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold tracking-tighter">
                                {entry.voucher.type} #{entry.voucher.voucherNo}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100 italic">
                                {partyLedger?.ledger?.name ||
                                  "Multiple Accounts"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-[11px] font-bold text-red-600">
                              {entry.amount > 0 ? fmt(entry.amount) : ""}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-[11px] font-bold text-emerald-600">
                              {entry.amount < 0
                                ? fmt(Math.abs(entry.amount))
                                : ""}
                            </td>
                            <td className="px-10 py-4 text-right font-mono font-black text-slate-900 text-[11px]">
                              {fmt(Math.abs(runningBalance))}
                              <span
                                className={`ml-2 text-[8px] px-1 py-0.5 rounded ${
                                  runningBalance >= 0
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-slate-800 text-slate-100"
                                }`}
                              >
                                {runningBalance >= 0 ? "DR" : "CR"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function SummaryTile({ label, amount, icon, color = "text-slate-900" }: any) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className={`text-xl font-mono font-bold mt-1 ${color}`}>
          {fmt(Math.abs(amount))}
        </p>
      </div>
      <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
        {icon}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 shadow-sm text-center p-10">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <FileText className="text-slate-300" size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
        Records Repository
      </h2>
      <p className="text-slate-500 mt-2 max-w-sm font-medium">
        Please select a ledger account from the navigator above.
      </p>
    </div>
  );
}
