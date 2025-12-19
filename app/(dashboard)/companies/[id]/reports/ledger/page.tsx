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
      openingBalance = (ledger.openingBalance || 0) + (prevDr - prevCr);

      entries = await prisma.voucherEntry.findMany({
        where: {
          ledgerId: lid,
          voucher: { date: { gte: fromISO, lte: toISO }, status: "APPROVED" },
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
    <div className="flex flex-col h-[calc(100vh-48px)] bg-slate-50 font-sans print:bg-white overflow-hidden">
      {/* COMPACT TOP NAV */}
      <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shrink-0 no-print shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-slate-900 rounded-lg text-white shadow-md">
            <Scale size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
              Ledger Explorer
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Audit & Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LedgerSearchFilter
            companyId={companyId}
            ledgers={ledgers}
            defaultLedgerId={ledgerId}
            defaultFrom={defaultFrom}
            defaultTo={defaultTo}
          />
          <div className="h-6 w-px bg-slate-200" />
          <ReportActionButtons
            ledgerName={reportData?.name}
            entries={entries}
            openingBalance={openingBalance}
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {reportData ? (
          <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">
            {/* COMPACT SIDEBAR SUMMARY */}
            <div className="col-span-12 lg:col-span-2 space-y-3 no-print">
              <SummaryTile
                label="Opening"
                amount={openingBalance}
                icon={<ArrowDownLeft size={12} />}
              />
              <SummaryTile
                label="Total Dr"
                amount={periodTotalDr}
                color="text-rose-600"
                icon={<ArrowUpRight size={12} />}
              />
              <SummaryTile
                label="Total Cr"
                amount={periodTotalCr}
                color="text-emerald-600"
                icon={<ArrowDownLeft size={12} />}
              />

              <div className="p-4 bg-slate-900 rounded-xl text-white shadow-lg border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Closing Balance
                </p>
                <p className="text-lg font-mono font-black mt-1 truncate">
                  ₹ {fmt(Math.abs(closingBalance))}
                </p>
                <p
                  className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block ${
                    closingBalance >= 0
                      ? "bg-white/10 text-blue-300"
                      : "bg-white/10 text-rose-300"
                  }`}
                >
                  {closingBalance >= 0 ? "DEBIT" : "CREDIT"}
                </p>
              </div>
            </div>

            {/* MAIN DATA TABLE */}
            <div className="col-span-12 lg:col-span-10">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Statement Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {reportData.name}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <CalendarDays size={14} className="text-slate-400" />
                    <span>
                      {fmtDate(new Date(defaultFrom))} —{" "}
                      {fmtDate(new Date(defaultTo))}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="bg-slate-100/50 text-slate-500 font-black uppercase tracking-tighter text-[9px] border-b border-slate-200">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-left">Code</th>
                        <th className="px-4 py-2 text-left">
                          Particulars / Party
                        </th>
                        <th className="px-4 py-2 text-right">Debit (Dr)</th>
                        <th className="px-4 py-2 text-right">Credit (Cr)</th>
                        <th className="px-6 py-2 text-right">Running Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* OPENING ROW */}
                      <tr className="bg-slate-50/80 italic text-[10px]">
                        <td className="px-4 py-1.5 text-slate-400 font-mono">
                          B/F
                        </td>
                        <td className="px-2 py-1.5 text-slate-300">—</td>
                        <td className="px-4 py-1.5 text-slate-500 font-bold uppercase tracking-tight">
                          Opening Balance Brought Forward
                        </td>
                        <td className="px-4 py-1.5 text-right font-mono text-slate-400">
                          {openingBalance > 0 ? fmt(openingBalance) : "—"}
                        </td>
                        <td className="px-4 py-1.5 text-right font-mono text-slate-400">
                          {openingBalance < 0
                            ? fmt(Math.abs(openingBalance))
                            : "—"}
                        </td>
                        <td className="px-6 py-1.5 text-right font-mono font-bold text-slate-400">
                          {fmt(Math.abs(openingBalance))}{" "}
                          {openingBalance >= 0 ? "Dr" : "Cr"}
                        </td>
                      </tr>

                      {entries.map((entry) => {
                        runningBalance += entry.amount;
                        const oppositeEntries = entry.voucher.entries.filter(
                          (vch: any) => vch.ledgerId !== entry.ledgerId
                        );
                        const partyNames = Array.from(
                          new Set(
                            oppositeEntries.map(
                              (oe: any) =>
                                oe.ledger?.name || oe.ledgerName || "Adjustment"
                            )
                          )
                        ).join(", ");

                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-blue-50/30 transition-colors text-[11px] group"
                          >
                            <td className="px-4 py-1.5 text-slate-900 font-bold whitespace-nowrap">
                              {fmtDate(entry.voucher.date)}
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="text-[9px] font-black font-mono text-blue-600 bg-blue-50 px-1 rounded">
                                #{entry.voucher.transactionCode.slice(-4)}
                              </span>
                            </td>
                            <td className="px-4 py-1.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-blue-900 uppercase tracking-tighter truncate max-w-[300px]">
                                  {partyNames || "Self Account"}
                                </span>
                                <span className="text-[9px] text-slate-400 italic line-clamp-1 group-hover:line-clamp-none">
                                  {entry.voucher.narration || "No narration"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-1.5 text-right font-mono font-bold text-rose-600">
                              {entry.amount > 0 ? fmt(entry.amount) : ""}
                            </td>
                            <td className="px-4 py-1.5 text-right font-mono font-bold text-emerald-600">
                              {entry.amount < 0
                                ? fmt(Math.abs(entry.amount))
                                : ""}
                            </td>
                            <td className="px-6 py-1.5 text-right font-mono font-black text-slate-900">
                              {fmt(Math.abs(runningBalance))}{" "}
                              <span className="text-[8px] font-bold opacity-50">
                                {runningBalance >= 0 ? "DR" : "CR"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-3 bg-slate-900 text-white flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">
                    Account Summary Closed
                  </p>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase opacity-60">
                      Net Ledger Balance
                    </span>
                    <p className="text-base font-mono font-black leading-none">
                      ₹ {fmt(Math.abs(closingBalance))}{" "}
                      {closingBalance >= 0 ? "DR" : "CR"}
                    </p>
                  </div>
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
    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
          {label}
        </p>
        <p className={`text-sm font-mono font-bold mt-1 ${color}`}>
          {fmt(Math.abs(amount))}
        </p>
      </div>
      <div className="text-slate-300">{icon}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 text-center p-10 max-w-4xl mx-auto">
      <FileText className="text-slate-100 mb-4" size={60} />
      <h2 className="text-lg font-black text-slate-900 uppercase">
        Select Account
      </h2>
      <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
        Choose a ledger to generate financial history
      </p>
    </div>
  );
}
