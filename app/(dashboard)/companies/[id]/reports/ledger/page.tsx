import { prisma } from "@/lib/prisma";
import LedgerFilters from "@/components/LedgerFilters";
import LedgerReportTable from "@/components/reports/LedgerReportTable";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  LayoutDashboard,
  Printer,
} from "lucide-react";
import Link from "next/link";

export default async function LedgerReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);
  const sp = await searchParams;
  const ledgerId = sp.ledgerId ? parseInt(sp.ledgerId) : null;

  // --- Date Logic ---
  const today = new Date();
  const currentYear =
    today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const from = sp.from || `${currentYear}-04-01`;
  const to = sp.to || today.toISOString().split("T")[0];

  const fromDate = new Date(from);
  const toDateEnd = new Date(to);
  toDateEnd.setHours(23, 59, 59, 999);

  // --- Fetch Master List ---
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      openingBalance: true,
      group: { select: { name: true } },
    },
  });

  const selectedLedger = ledgers.find((l) => l.id === ledgerId);

  let transactions: any[] = [];
  let openingBalance = 0;
  let closingBalance = 0;
  let periodDebit = 0;
  let periodCredit = 0;
  let periodQty = 0;

  if (ledgerId && selectedLedger) {
    // 1. Calculate Previous Balance
    const prevFilter = { date: { lt: fromDate }, status: "APPROVED" };

    const getPrevSum = async (model: any, field: string) => {
      const res = await model.aggregate({
        where: { ledgerId, [field]: prevFilter },
        _sum: { amount: true },
      });
      return res._sum.amount || 0;
    };

    const [pSales, pPur, pPay, pRcpt, pCntr, pJrnl] = await Promise.all([
      getPrevSum(prisma.salesLedgerEntry, "salesVoucher"),
      getPrevSum(prisma.purchaseLedgerEntry, "purchaseVoucher"),
      getPrevSum(prisma.paymentLedgerEntry, "paymentVoucher"),
      getPrevSum(prisma.receiptLedgerEntry, "receiptVoucher"),
      getPrevSum(prisma.contraLedgerEntry, "contraVoucher"),
      getPrevSum(prisma.journalLedgerEntry, "journalVoucher"),
    ]);

    const totalPrevMovement = pSales + pPur + pPay + pRcpt + pCntr + pJrnl;
    openingBalance = selectedLedger.openingBalance + totalPrevMovement;

    // 2. Fetch Current Transactions
    const currentFilter = {
      date: { gte: fromDate, lte: toDateEnd },
      status: "APPROVED",
    };

    // Helper for basic includes
    const commonInclude = (vKey: string) => ({
      [vKey]: {
        include: {
          ledgerEntries: { include: { ledger: { select: { name: true } } } },
        },
      },
    });

    // FIXED: Changed 'item' to 'stockItem' based on your error log
    const inventoryInclude = (vKey: string) => ({
      [vKey]: {
        include: {
          ledgerEntries: { include: { ledger: { select: { name: true } } } },
          inventoryEntries: {
            include: { stockItem: { select: { name: true } } },
          },
        },
      },
    });

    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesLedgerEntry.findMany({
          where: { ledgerId, salesVoucher: currentFilter },
          include: inventoryInclude("salesVoucher"),
        }),
        prisma.purchaseLedgerEntry.findMany({
          where: { ledgerId, purchaseVoucher: currentFilter },
          include: inventoryInclude("purchaseVoucher"),
        }),
        prisma.paymentLedgerEntry.findMany({
          where: { ledgerId, paymentVoucher: currentFilter },
          include: commonInclude("paymentVoucher"),
        }),
        prisma.receiptLedgerEntry.findMany({
          where: { ledgerId, receiptVoucher: currentFilter },
          include: commonInclude("receiptVoucher"),
        }),
        prisma.contraLedgerEntry.findMany({
          where: { ledgerId, contraVoucher: currentFilter },
          include: commonInclude("contraVoucher"),
        }),
        prisma.journalLedgerEntry.findMany({
          where: { ledgerId, journalVoucher: currentFilter },
          include: commonInclude("journalVoucher"),
        }),
      ]);

    // Format Logic
    const formatTx = (entry: any, type: string, vKey: string) => {
      const voucher = entry[vKey];
      const otherEntry = voucher.ledgerEntries.find(
        (e: any) => e.ledgerId !== ledgerId
      );

      const particularName =
        otherEntry?.ledger?.name ||
        (type === "SALES"
          ? "Sales A/c"
          : type === "PURCHASE"
          ? "Purchase A/c"
          : "As per details");

      // --- Inventory Extraction Logic (Fixed: using stockItem) ---
      let itemNames = "-";
      let totalQty = 0;

      if (voucher.inventoryEntries && voucher.inventoryEntries.length > 0) {
        const items = voucher.inventoryEntries;
        // Updated to use stockItem.name
        itemNames = items
          .map((i: any) => i.stockItem?.name || "Item")
          .join(", ");
        totalQty = items.reduce(
          (sum: number, i: any) => sum + (Number(i.quantity) || 0),
          0
        );
      }

      return {
        id: entry.id,
        date: voucher.date,
        voucherNo: voucher.voucherNo,
        type: type,
        txid: voucher.transactionCode,
        particulars: particularName,
        narration: voucher.narration,
        // Inventory Fields
        itemNames:
          itemNames.length > 30
            ? itemNames.substring(0, 30) + "..."
            : itemNames,
        quantity: totalQty,
        // Money Fields
        debit: entry.amount < 0 ? Math.abs(entry.amount) : 0,
        credit: entry.amount > 0 ? entry.amount : 0,
        amount: entry.amount,
        voucherId: voucher.id,
      };
    };

    const rawTxs = [
      ...sales.map((e) => formatTx(e, "SALES", "salesVoucher")),
      ...purchase.map((e) => formatTx(e, "PURCHASE", "purchaseVoucher")),
      ...payment.map((e) => formatTx(e, "PAYMENT", "paymentVoucher")),
      ...receipt.map((e) => formatTx(e, "RECEIPT", "receiptVoucher")),
      ...contra.map((e) => formatTx(e, "CONTRA", "contraVoucher")),
      ...journal.map((e) => formatTx(e, "JOURNAL", "journalVoucher")),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Calculate Running Balance
    let running = openingBalance;
    transactions = rawTxs.map((t) => {
      running += t.amount;
      periodDebit += t.debit;
      periodCredit += t.credit;
      periodQty += t.quantity;
      return { ...t, balance: running };
    });
    closingBalance = running;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-200">
                Financial Reports
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-slate-400" size={28} />
              Ledger Statement
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <LedgerFilters
                ledgers={ledgers}
                selectedId={ledgerId}
                fromDate={from}
                toDate={to}
              />
            </div>

            {selectedLedger && (
              <Link
                href={`/companies/${companyId}/reports/ledger/print?ledgerId=${ledgerId}&from=${from}&to=${to}`}
                target="_blank"
                className="bg-slate-900 hover:bg-slate-800 text-white p-2 px-6 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 font-bold text-sm transition-all"
              >
                <Printer size={18} />
                <span>Print</span>
              </Link>
            )}
          </div>
        </div>

        {selectedLedger ? (
          <>
            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                label="Opening Balance"
                amount={openingBalance}
                icon={<History className="text-slate-400" />}
                type="neutral"
                sub="Brought Forward"
              />
              <StatCard
                label="Period Debit"
                amount={periodDebit}
                icon={<ArrowUpRight className="text-emerald-500" />}
                type="debit"
                sub="Total Outflow"
              />
              <StatCard
                label="Period Credit"
                amount={periodCredit}
                icon={<ArrowDownLeft className="text-rose-500" />}
                type="credit"
                sub="Total Inflow"
              />
              <StatCard
                label="Closing Balance"
                amount={closingBalance}
                icon={<Wallet className="text-blue-500" />}
                type="balance"
                isMain
                sub="Carried Forward"
              />
            </div>

            {/* --- TABLE HEADER INFO --- */}
            <div className="px-1 flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 font-bold text-lg shadow-sm">
                {selectedLedger.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">
                  {selectedLedger.name}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {selectedLedger.group?.name || "General Ledger"}
                </p>
              </div>
            </div>

            {/* --- THE NEW INTERACTIVE TABLE --- */}
            <LedgerReportTable
              transactions={transactions}
              companyId={companyId}
              periodDebit={periodDebit}
              periodCredit={periodCredit}
              periodQty={periodQty}
              closingBalance={closingBalance}
              openingBalance={openingBalance}
              fromDate={fromDate}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              No Ledger Selected
            </h2>
            <p className="text-slate-500 font-medium max-w-md text-center">
              Please select an account from the search bar above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep the StatCard component here as it was
function StatCard({ label, amount, icon, type, sub, isMain }: any) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const styles: any = {
    neutral: "bg-white border-slate-200 text-slate-900",
    debit: "bg-white border-slate-200 text-emerald-700",
    credit: "bg-white border-slate-200 text-rose-700",
    balance: isMain
      ? "bg-blue-600 border-blue-600 text-white shadow-blue-200"
      : "bg-white",
  };
  const currentStyle = styles[type];

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all ${currentStyle} ${
        isMain ? "shadow-xl shadow-blue-900/20" : ""
      }`}
    >
      {isMain && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      )}
      <div className="flex justify-between items-start z-10">
        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              isMain ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {label}
          </p>
          <h3 className="text-2xl font-black tracking-tight flex items-baseline gap-1">
            <span className="text-sm opacity-70">₹</span>
            {absAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            <span
              className={`text-xs font-bold ml-1 ${
                isMain ? "text-blue-200" : "text-slate-400"
              }`}
            >
              {isNegative ? "Dr" : "Cr"}
            </span>
          </h3>
        </div>
        <div
          className={`p-2.5 rounded-xl ${
            isMain ? "bg-white/20 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {icon}
        </div>
      </div>
      <div
        className={`text-[10px] font-bold uppercase tracking-wide mt-auto flex items-center gap-1 ${
          isMain ? "text-blue-100" : "text-slate-400"
        }`}
      >
        {sub}
      </div>
    </div>
  );
}
