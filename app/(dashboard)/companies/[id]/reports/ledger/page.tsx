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
  ChevronRight,
  CreditCard,
  Building2,
  ShieldCheck,
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
  let fromDateStr = sp.from;

  if (!fromDateStr && ledgerId) {
    const getEarliest = async (model: any, relation: string) => {
      const rec = await model.findFirst({
        where: { ledgerId, [relation]: { status: "APPROVED" } }, // Picks up Admin Auto-Verified & Checker Approved
        select: { [relation]: { select: { date: true } } },
        orderBy: { [relation]: { date: "asc" } },
      });
      return rec ? new Date(rec[relation].date) : null;
    };

    const dates = await Promise.all([
      getEarliest(prisma.salesLedgerEntry, "salesVoucher"),
      getEarliest(prisma.purchaseLedgerEntry, "purchaseVoucher"),
      getEarliest(prisma.paymentLedgerEntry, "paymentVoucher"),
      getEarliest(prisma.receiptLedgerEntry, "receiptVoucher"),
      getEarliest(prisma.contraLedgerEntry, "contraVoucher"),
      getEarliest(prisma.journalLedgerEntry, "journalVoucher"),
    ]);

    const minDate = dates.filter(Boolean).sort((a: any, b: any) => a - b)[0];
    if (minDate) {
      fromDateStr = minDate.toISOString().split("T")[0];
    } else {
      const currentYear =
        today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
      fromDateStr = `${currentYear}-04-01`;
    }
  } else if (!fromDateStr) {
    const currentYear =
      today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    fromDateStr = `${currentYear}-04-01`;
  }

  const to = sp.to || today.toISOString().split("T")[0];
  const fromDate = new Date(fromDateStr);
  const toDateEnd = new Date(to);
  toDateEnd.setHours(23, 59, 59, 999);

  // --- Fetch Ledgers ---
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
    // --- 1. Opening Balance Calculation (Strictly APPROVED status) ---
    const historyFilter = { date: { lt: fromDate }, status: "APPROVED" };

    const getPrevSum = async (model: any, field: string) => {
      const res = await model.aggregate({
        where: { ledgerId, [field]: historyFilter },
        _sum: { amount: true },
      });
      return res._sum.amount || 0;
    };

    const prevSums = await Promise.all([
      getPrevSum(prisma.salesLedgerEntry, "salesVoucher"),
      getPrevSum(prisma.purchaseLedgerEntry, "purchaseVoucher"),
      getPrevSum(prisma.paymentLedgerEntry, "paymentVoucher"),
      getPrevSum(prisma.receiptLedgerEntry, "receiptVoucher"),
      getPrevSum(prisma.contraLedgerEntry, "contraVoucher"),
      getPrevSum(prisma.journalLedgerEntry, "journalVoucher"),
    ]);

    openingBalance =
      selectedLedger.openingBalance + prevSums.reduce((a, b) => a + b, 0);

    // --- 2. Current Transactions Fetch ---
    const currentFilter = {
      date: { gte: fromDate, lte: toDateEnd },
      status: "APPROVED",
    };

    const commonInclude = (vKey: string) => ({
      [vKey]: {
        include: {
          ledgerEntries: { include: { ledger: { select: { name: true } } } },
          verifiedBy: { select: { name: true, role: true } }, // NEW: Include verifier info
        },
      },
    });

    const inventoryInclude = (vKey: string) => ({
      [vKey]: {
        include: {
          ledgerEntries: { include: { ledger: { select: { name: true } } } },
          // ✅ FIX: Ensure inventoryEntries are included to calculate Qty
          inventoryEntries: {
            include: { stockItem: { select: { name: true } } },
          },
          verifiedBy: { select: { name: true, role: true } },
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

    // --- 3. Format & Sort ---
    const formatTx = (entry: any, type: string, vKey: string) => {
      const voucher = entry[vKey];
      if (!voucher) return null;

      const otherEntry = voucher.ledgerEntries?.find(
        (e: any) => e.ledgerId !== ledgerId
      );
      let particularsName = otherEntry?.ledger?.name;

      if (!particularsName) {
        if (type === "SALES")
          particularsName = voucher.partyName || "Sales A/c";
        else if (type === "PURCHASE")
          particularsName = voucher.partyName || "Purchase A/c";
        else particularsName = type;
      }

      // Check if this was an Admin Auto-Verify
      const isAutoVerified =
        voucher.verifiedBy?.role === "ADMIN" &&
        voucher.createdById === voucher.verifiedById;

      // ✅ FIX: Calculate Total Quantity for this Transaction
      const qty =
        voucher.inventoryEntries?.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        ) || 0;

      // Optional: Get first item name for display if needed (e.g. "PLANT + 2 others")
      const firstItem = voucher.inventoryEntries?.[0]?.stockItem?.name;
      const itemCount = voucher.inventoryEntries?.length || 0;
      const itemDisplay =
        itemCount > 1 ? `${firstItem} (+${itemCount - 1})` : firstItem || "";

      return {
        id: entry.id,
        date: voucher.date,
        voucherNo: voucher.voucherNo,
        type,
        txid: voucher.transactionCode,
        particulars: particularsName,
        narration: voucher.narration,
        isAutoVerified, // Flag for UI
        debit: entry.amount < 0 ? Math.abs(entry.amount) : 0,
        credit: entry.amount > 0 ? entry.amount : 0,
        amount: entry.amount,
        voucherId: voucher.id,
        quantity: qty, // ✅ Passed to Table
        itemName: itemDisplay, // ✅ Passed to Table
      };
    };

    const rawTxs = [
      ...sales.map((e) => formatTx(e, "SALES", "salesVoucher")),
      ...purchase.map((e) => formatTx(e, "PURCHASE", "purchaseVoucher")),
      ...payment.map((e) => formatTx(e, "PAYMENT", "paymentVoucher")),
      ...receipt.map((e) => formatTx(e, "RECEIPT", "receiptVoucher")),
      ...contra.map((e) => formatTx(e, "CONTRA", "contraVoucher")),
      ...journal.map((e) => formatTx(e, "JOURNAL", "journalVoucher")),
    ]
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    let running = openingBalance;
    transactions = rawTxs.map((t: any) => {
      running += t.amount;
      periodDebit += t.debit;
      periodCredit += t.credit;
      periodQty += t.quantity || 0; // ✅ Summing up for stats
      return { ...t, balance: running };
    });
    closingBalance = running;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sticky top-0 z-30 print:hidden mt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <Link
                href={`/companies/${companyId}/reports`}
                className="hover:text-indigo-600"
              >
                Reports
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">Ledger Statement</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Building2
                className="text-indigo-600 hidden sm:block"
                size={28}
              />
              Account Statement
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <LedgerFilters
              ledgers={ledgers}
              selectedId={ledgerId}
              fromDate={fromDateStr}
              toDate={to}
            />
            {selectedLedger && (
              <Link
                href={`/companies/${companyId}/reports/ledger/print?ledgerId=${ledgerId}&from=${fromDateStr}&to=${to}`}
                target="_blank"
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all h-11"
              >
                <Printer size={16} />
                <span>Print</span>
              </Link>
            )}
          </div>
        </div>

        {selectedLedger ? (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Opening Balance"
                amount={openingBalance}
                icon={<History size={18} />}
                type={
                  openingBalance < 0
                    ? "debit"
                    : openingBalance > 0
                    ? "credit"
                    : "neutral"
                }
                sub="Brought Forward"
              />
              <StatCard
                label="Period Debit"
                amount={periodDebit}
                icon={<ArrowUpRight size={18} />}
                type="debit"
                sub="Total Dr"
                forceDr
              />
              <StatCard
                label="Period Credit"
                amount={periodCredit}
                icon={<ArrowDownLeft size={18} />}
                type="credit"
                sub="Total Cr"
                forceCr
              />
              <StatCard
                label="Closing Balance"
                amount={closingBalance}
                icon={<Wallet size={18} />}
                type="balance"
                isMain
                sub="Net Position"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-none">
                      {selectedLedger.name}
                    </h3>
                    <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">
                      {selectedLedger.group?.name}
                    </span>
                  </div>
                </div>
                {/* Audit Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    Audit Verified Records
                  </span>
                </div>
              </div>
              <LedgerReportTable
                transactions={transactions}
                companyId={companyId}
                periodDebit={periodDebit}
                periodCredit={periodCredit}
                periodQty={periodQty}
                closingBalance={closingBalance}
                openingBalance={openingBalance}
                fromDate={fromDate}
                toDate={toDateEnd}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <LayoutDashboard className="text-slate-300 mb-6" size={40} />
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Select a Ledger to View Statement
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}

// ... StatCard component (unchanged) ...
function StatCard({
  label,
  amount,
  icon,
  type,
  sub,
  isMain,
  forceDr,
  forceCr,
}: any) {
  const isDr = forceDr ? true : forceCr ? false : amount < 0;
  const absAmount = Math.abs(amount);
  const themes: any = {
    neutral: {
      bg: "bg-white",
      text: "text-slate-900",
      icon: "text-slate-400 bg-slate-50",
      border: "border-slate-200",
    },
    debit: {
      bg: "bg-white",
      text: "text-rose-700",
      icon: "text-rose-600 bg-rose-50",
      border: "border-rose-100",
    },
    credit: {
      bg: "bg-white",
      text: "text-emerald-700",
      icon: "text-emerald-600 bg-emerald-50",
      border: "border-emerald-100",
    },
    balance: {
      bg: "bg-slate-900",
      text: "text-white",
      icon: "text-indigo-300 bg-white/10",
      border: "border-slate-900",
    },
  };
  const t = themes[type] || themes.neutral;

  return (
    <div
      className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:shadow-md ${t.bg} ${t.border}`}
    >
      <div className="flex justify-between items-start z-10">
        <div className={`p-2 rounded-xl ${t.icon}`}>{icon}</div>
        <span
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
            isMain
              ? "bg-white/10 text-indigo-200"
              : "bg-slate-50 text-slate-400"
          }`}
        >
          {sub}
        </span>
      </div>
      <div className="z-10 mt-2">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
            isMain ? "text-indigo-200" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <h3
          className={`text-2xl font-black tracking-tight flex items-baseline gap-1 ${t.text}`}
        >
          <span className="text-sm opacity-70">₹</span>
          {absAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          <span
            className={`text-xs font-bold ml-1 ${
              isMain
                ? isDr
                  ? "text-rose-400"
                  : "text-emerald-400"
                : isDr
                ? "text-rose-500"
                : "text-emerald-500"
            }`}
          >
            {absAmount === 0 ? "" : isDr ? "Dr" : "Cr"}
          </span>
        </h3>
      </div>
    </div>
  );
}
