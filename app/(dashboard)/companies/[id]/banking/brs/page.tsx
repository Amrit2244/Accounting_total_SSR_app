import { prisma } from "@/lib/prisma";
import { Building2, ArrowLeft } from "lucide-react";
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
      group: { name: { contains: "Bank" } }, // Simple filter for Bank accounts
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

    // A. Balance as per Company Books (Sum of everything)
    const totalDr = entries.reduce(
      (sum, e) => sum + (e.amount > 0 ? e.amount : 0),
      0
    );
    const totalCr = entries.reduce(
      (sum, e) => sum + (e.amount < 0 ? Math.abs(e.amount) : 0),
      0
    );
    bookBalance = opening + (totalDr - totalCr);

    // B. Balance as per Bank (Sum of ONLY Reconciled entries)
    // We look at entries that HAVE a bankDate
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Building2 /> BANK RECONCILIATION
        </h1>
        <Link
          href={`/companies/${companyId}`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* BANK SELECTOR */}
      <div className="bg-white p-6 border border-gray-300 rounded-lg shadow-sm mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Select Bank Account
          </label>
          <div className="flex gap-2">
            {bankLedgers.map((l) => (
              <Link
                key={l.id}
                href={`?ledgerId=${l.id}`}
                className={`px-4 py-2 rounded border text-sm font-bold ${
                  ledgerId === l.id.toString()
                    ? "bg-[#003366] text-white border-[#003366]"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {l.name}
              </Link>
            ))}
          </div>
          {bankLedgers.length === 0 && (
            <p className="text-red-500 text-xs mt-2">
              No Bank Ledgers found. Create one under "Bank Accounts" group.
            </p>
          )}
        </div>
      </div>

      {ledgerId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: THE LIST */}
          <div className="lg:col-span-2 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs border-b">
                <tr>
                  <th className="p-3 border-r">Vch Date</th>
                  <th className="p-3 border-r">Particulars</th>
                  <th className="p-3 border-r text-right">Debit</th>
                  <th className="p-3 border-r text-right">Credit</th>
                  <th className="p-3 text-center">Bank Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <BrsRow key={e.id} entry={e} />
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* RIGHT: THE SUMMARY */}
          <div className="space-y-4">
            <div className="bg-[#003366] text-white p-6 rounded-lg shadow-md">
              <p className="text-xs font-bold opacity-70 uppercase mb-1">
                Balance as per Company Books
              </p>
              <h2 className="text-3xl font-mono font-bold">
                ₹ {fmt(bookBalance)}
              </h2>
              <p className="text-xs mt-1 opacity-70 italic">
                (All approved vouchers)
              </p>
            </div>

            <div className="bg-green-600 text-white p-6 rounded-lg shadow-md">
              <p className="text-xs font-bold opacity-70 uppercase mb-1">
                Balance as per Bank
              </p>
              <h2 className="text-3xl font-mono font-bold">
                ₹ {fmt(bankBalance)}
              </h2>
              <p className="text-xs mt-1 opacity-70 italic">
                (Only reconciled vouchers)
              </p>
            </div>

            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Difference
              </p>
              <h2
                className={`text-2xl font-mono font-bold ${
                  bookBalance === bankBalance
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                ₹ {fmt(bookBalance - bankBalance)}
              </h2>
              <p className="text-xs text-gray-400 mt-2">
                Amounts not reflected in bank: <br />
                Cheques issued but not cleared, etc.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
