import { prisma } from "@/lib/prisma";
import LedgerControls from "./controls"; // Import the client component

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

  // Default Dates
  const today = new Date();
  const defaultFrom = from || `${today.getFullYear()}-04-01`;
  const defaultTo = to || `${today.getFullYear() + 1}-03-31`;

  // Fetch Ledgers for Dropdown
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    select: { id: true, name: true }, // Select minimal data
    orderBy: { name: "asc" },
  });

  // --- REPORT LOGIC (Server Side) ---
  let entries: any[] = [];
  let openingBalance = 0;
  let closingBalance = 0;
  let selectedLedgerName = "";

  if (ledgerId) {
    const lid = parseInt(ledgerId);
    const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
    selectedLedgerName = ledger?.name || "";

    // 1. Calculate Opening Balance
    const preEntries = await prisma.voucherEntry.findMany({
      where: {
        ledgerId: lid,
        voucher: {
          companyId,
          status: "APPROVED",
          date: { lt: new Date(defaultFrom) },
        },
      },
    });
    const preSum = preEntries.reduce((acc, curr) => acc + curr.amount, 0);
    openingBalance = (ledger?.openingBalance || 0) + preSum;

    // 2. Fetch Transactions
    entries = await prisma.voucherEntry.findMany({
      where: {
        ledgerId: lid,
        voucher: {
          companyId,
          status: "APPROVED",
          date: { gte: new Date(defaultFrom), lte: new Date(defaultTo) },
        },
      },
      include: { voucher: true },
      orderBy: { voucher: { date: "asc" } },
    });
  }

  // Calculate Running Balance
  let runningBal = openingBalance;
  const rows = entries.map((e) => {
    runningBal += e.amount;
    return { ...e, balance: runningBal };
  });
  closingBalance = runningBal;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* 1. CONTROL PANEL (Client Component) */}
      <div className="bg-white p-4 border border-gray-300 shadow-sm mb-4">
        <LedgerControls
          companyId={companyId}
          ledgers={ledgers}
          defaultLedgerId={ledgerId}
          defaultFrom={defaultFrom}
          defaultTo={defaultTo}
        />
      </div>

      {/* 2. REPORT AREA (Server Rendered) */}
      {ledgerId ? (
        <div className="bg-white border border-gray-300 flex-1 overflow-auto shadow-sm">
          <div className="bg-[#e6f0ff] p-4 text-center border-b border-gray-300">
            <h2 className="text-xl font-extrabold text-[#003366] uppercase">
              {selectedLedgerName}
            </h2>
            <p className="text-xs text-gray-600 font-bold mt-1">
              Period: {new Date(defaultFrom).toLocaleDateString()} to{" "}
              {new Date(defaultTo).toLocaleDateString()}
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b-2 border-gray-300 text-gray-700 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3 w-32 border-r border-gray-200">Date</th>
                <th className="p-3 w-32 border-r border-gray-200">Vch No</th>
                <th className="p-3 border-r border-gray-200">
                  Narration / Type
                </th>
                <th className="p-3 text-right w-32 border-r border-gray-200">
                  Debit
                </th>
                <th className="p-3 text-right w-32 border-r border-gray-200">
                  Credit
                </th>
                <th className="p-3 text-right w-40">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {/* OPENING BALANCE */}
              <tr className="bg-yellow-50 font-bold">
                <td
                  colSpan={3}
                  className="p-3 text-right text-gray-600 italic border-r border-gray-200"
                >
                  Opening Balance:
                </td>
                <td className="p-3 text-right border-r border-gray-200"></td>
                <td className="p-3 text-right border-r border-gray-200"></td>
                <td className="p-3 text-right font-mono text-black">
                  {Math.abs(openingBalance).toFixed(2)}{" "}
                  {openingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>

              {/* TRANSACTIONS */}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium border-r border-gray-100">
                    {new Date(row.voucher.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-[#003366] font-bold border-r border-gray-100">
                    {row.voucher.type} #{row.voucher.voucherNo}
                  </td>
                  <td className="p-3 text-gray-600 border-r border-gray-100">
                    {row.voucher.narration || "-"}
                  </td>
                  <td className="p-3 text-right font-mono border-r border-gray-100">
                    {row.amount > 0 ? row.amount.toFixed(2) : ""}
                  </td>
                  <td className="p-3 text-right font-mono border-r border-gray-100">
                    {row.amount < 0 ? Math.abs(row.amount).toFixed(2) : ""}
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    {Math.abs(row.balance).toFixed(2)}{" "}
                    {row.balance >= 0 ? "Dr" : "Cr"}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-400 italic"
                  >
                    No transactions in this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-[#003366] text-white font-bold sticky bottom-0">
              <tr>
                <td colSpan={3} className="p-3 text-right">
                  Closing Balance:
                </td>
                <td className="p-3 text-right"></td>
                <td className="p-3 text-right"></td>
                <td className="p-3 text-right font-mono text-yellow-300 text-sm">
                  {Math.abs(closingBalance).toFixed(2)}{" "}
                  {closingBalance >= 0 ? "Dr" : "Cr"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic bg-gray-50 border border-gray-200 rounded">
          Select a Ledger from the dropdown to view its statement.
        </div>
      )}
    </div>
  );
}
