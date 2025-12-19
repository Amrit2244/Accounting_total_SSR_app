import { prisma } from "@/lib/prisma";
import {
  Landmark,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
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
    entries = await prisma.voucherEntry.findMany({
      where: { ledgerId: lid, voucher: { status: "APPROVED" } },
      include: { voucher: true },
      orderBy: { voucher: { date: "asc" } },
    });

    const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
    const opening = ledger?.openingBalance || 0;

    const totalDr = entries.reduce(
      (sum, e) => sum + (e.amount > 0 ? e.amount : 0),
      0
    );
    const totalCr = entries.reduce(
      (sum, e) => sum + (e.amount < 0 ? Math.abs(e.amount) : 0),
      0
    );
    bookBalance = opening + (totalDr - totalCr);

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
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded text-white shadow-sm">
            <Landmark size={18} />
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            Bank Reconciliation
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}`}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </div>

      {/* BANK SELECTOR */}
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Bank Ledger:
          </span>
          <div className="flex flex-wrap gap-2">
            {bankLedgers.map((l) => {
              const isActive = ledgerId === l.id.toString();
              return (
                <Link
                  key={l.id}
                  href={`?ledgerId=${l.id}`}
                  className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {l.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {ledgerId && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
          {/* TRANSACTION TABLE */}
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-[12px] text-left">
              <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Particulars</th>
                  <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                  <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                  <th className="px-4 py-2.5 text-center bg-blue-800">
                    Bank Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <BrsRow key={e.id} entry={e} />
                ))}
              </tbody>
            </table>
          </div>

          {/* COMPACT SUMMARY SIDEBAR */}
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Book Balance
              </p>
              <h2 className="text-xl font-mono font-black text-slate-900">
                ₹{fmt(bookBalance)}
              </h2>
            </div>

            <div className="bg-emerald-600 p-4 rounded-xl shadow-md text-white">
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">
                Bank Statement
              </p>
              <h2 className="text-xl font-mono font-black">
                ₹{fmt(bankBalance)}
              </h2>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                diff === 0 ? "bg-white" : "bg-rose-50 border-rose-100"
              }`}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Difference
              </p>
              <h2
                className={`text-xl font-mono font-black ${
                  diff === 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                ₹{fmt(diff)}
              </h2>
              {diff !== 0 && (
                <div className="mt-2 text-[10px] text-rose-700 font-bold uppercase flex items-center gap-1">
                  <AlertCircle size={10} /> Discrepancy Found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
