import { prisma } from "@/lib/prisma";
import {
  Landmark,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import BrsRow from "@/components/BrsRow";

export default async function BrsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string }>;
}) {
  const { id } = await params;
  const { ledgerId } = await searchParams;
  const companyId = parseInt(id);

  // 1. Get All Bank Ledgers
  const bankLedgers = await prisma.ledger.findMany({
    where: {
      companyId,
      group: { name: { contains: "Bank" } },
    },
  });

  let entries: any[] = [];
  let bookBalance = 0;
  let bankBalance = 0;

  if (ledgerId) {
    const lid = parseInt(ledgerId);

    // 2. Fetch Entries for this Bank
    entries = await prisma.voucherEntry.findMany({
      where: { ledgerId: lid, voucher: { status: "APPROVED" } },
      include: { voucher: true },
      orderBy: { voucher: { date: "asc" } },
    });

    // 3. Calculate Balances
    const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
    const opening = ledger?.openingBalance || 0;

    // A. Balance as per Company Books
    const totalDr = entries.reduce(
      (sum, e) => sum + (e.amount > 0 ? e.amount : 0),
      0
    );
    const totalCr = entries.reduce(
      (sum, e) => sum + (e.amount < 0 ? Math.abs(e.amount) : 0),
      0
    );
    bookBalance = opening + (totalDr - totalCr);

    // B. Balance as per Bank (Only Reconciled)
    const reconciledEntries = entries.filter((e) => e.bankDate !== null);
    const recDr = reconciledEntries.reduce(
      (sum, e) => sum + (e.amount > 0 ? e.amount : 0),
      0
    );
    const recCr = reconciledEntries.reduce(
      (sum, e) => sum + (e.amount < 0 ? Math.abs(e.amount) : 0),
      0
    );
    bankBalance = opening + (recDr - recCr);
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const diff = bookBalance - bankBalance;

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 text-white">
              <Landmark size={24} />
            </div>
            Bank Reconciliation
          </h1>
          <p className="text-slate-500 mt-1 ml-1">
            Match company books with bank statements.
          </p>
        </div>
        <Link
          href={`/companies/${companyId}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* 2. BANK SELECTOR */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Select Bank Account
        </label>
        <div className="flex flex-wrap gap-3">
          {bankLedgers.map((l) => {
            const isActive = ledgerId === l.id.toString();
            return (
              <Link
                key={l.id}
                href={`?ledgerId=${l.id}`}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
                  ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-sm"
                  }
                `}
              >
                <Landmark
                  size={14}
                  className={isActive ? "text-blue-200" : "text-slate-400"}
                />
                {l.name}
              </Link>
            );
          })}
        </div>

        {bankLedgers.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle size={16} />
            <span>
              No Bank Ledgers found. Create one under the "Bank Accounts" group
              in Ledgers.
            </span>
          </div>
        )}
      </div>

      {ledgerId && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: TRANSACTION TABLE */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Transaction History
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {entries.length} Entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 whitespace-nowrap">Vch Date</th>
                      <th className="px-6 py-3">Particulars</th>
                      <th className="px-6 py-3 text-right">Debit</th>
                      <th className="px-6 py-3 text-right">Credit</th>
                      <th className="px-6 py-3 text-center bg-blue-50/50 text-blue-700">
                        Bank Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((e) => (
                      <BrsRow key={e.id} entry={e} />
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar size={32} className="text-slate-200" />
                            <p>No transactions found for this period.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: SUMMARY CARDS */}
          <div className="space-y-4">
            {/* Book Balance Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8" />
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Company Book Balance
                </p>
                <h2 className="text-3xl font-mono font-bold text-slate-900">
                  ₹ {fmt(bookBalance)}
                </h2>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
                  <CheckCircle size={12} className="text-blue-500" />
                  All approved vouchers
                </div>
              </div>
            </div>

            {/* Bank Balance Card */}
            <div className="bg-emerald-600 p-6 rounded-xl border border-emerald-500 shadow-md text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                  Bank Statement Balance
                </p>
                <h2 className="text-3xl font-mono font-bold text-white">
                  ₹ {fmt(bankBalance)}
                </h2>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-100 font-medium">
                  <Calendar size={12} />
                  Reconciled entries only
                </div>
              </div>
            </div>

            {/* Difference Card */}
            <div
              className={`p-6 rounded-xl border shadow-sm ${
                diff === 0
                  ? "bg-white border-slate-200"
                  : "bg-rose-50 border-rose-100"
              }`}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Reconciliation Difference
              </p>
              <h2
                className={`text-2xl font-mono font-bold ${
                  diff === 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                ₹ {fmt(diff)}
              </h2>

              {diff !== 0 && (
                <div className="mt-3 p-3 bg-white/60 rounded border border-rose-100 text-xs text-rose-700">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Discrepancy Found
                  </p>
                  <p>Amounts not reflected in bank (Uncleared Cheques, etc).</p>
                </div>
              )}
              {diff === 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-bold">
                  <CheckCircle size={14} /> Books Match Bank perfectly!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
