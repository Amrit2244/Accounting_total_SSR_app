import { prisma } from "@/lib/prisma";
import LedgerReportClient from "@/components/LedgerReportClient";

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

  // Defaults
  const today = new Date();
  const currentYear =
    today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const from = sp.from || `${currentYear}-04-01`;
  const to = sp.to || today.toISOString().split("T")[0];

  const fromDate = new Date(from);
  const toDateEnd = new Date(to);
  toDateEnd.setHours(23, 59, 59, 999);

  // 1. Fetch Ledgers for Dropdown
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, openingBalance: true },
  });

  let transactions: any[] = [];
  let openingBalance = 0;
  let closingBalance = 0;

  if (ledgerId) {
    const ledger = ledgers.find((l) => l.id === ledgerId);

    if (ledger) {
      // 2. Calculate Opening Balance
      const prevFilter = { date: { lt: fromDate }, status: "APPROVED" };
      const [prevSales, prevPur, prevPay, prevRcpt, prevCntr, prevJrnl] =
        await Promise.all([
          prisma.salesLedgerEntry.aggregate({
            where: { ledgerId, salesVoucher: prevFilter },
            _sum: { amount: true },
          }),
          prisma.purchaseLedgerEntry.aggregate({
            where: { ledgerId, purchaseVoucher: prevFilter },
            _sum: { amount: true },
          }),
          prisma.paymentLedgerEntry.aggregate({
            where: { ledgerId, paymentVoucher: prevFilter },
            _sum: { amount: true },
          }),
          prisma.receiptLedgerEntry.aggregate({
            where: { ledgerId, receiptVoucher: prevFilter },
            _sum: { amount: true },
          }),
          prisma.contraLedgerEntry.aggregate({
            where: { ledgerId, contraVoucher: prevFilter },
            _sum: { amount: true },
          }),
          prisma.journalLedgerEntry.aggregate({
            where: { ledgerId, journalVoucher: prevFilter },
            _sum: { amount: true },
          }),
        ]);

      const totalPrevMovement =
        (prevSales._sum.amount || 0) +
        (prevPur._sum.amount || 0) +
        (prevPay._sum.amount || 0) +
        (prevRcpt._sum.amount || 0) +
        (prevCntr._sum.amount || 0) +
        (prevJrnl._sum.amount || 0);

      openingBalance = ledger.openingBalance + totalPrevMovement;

      // 3. Fetch Current Transactions
      const currentFilter = {
        date: { gte: fromDate, lte: toDateEnd },
        status: "APPROVED",
      };

      const [sales, purchase, payment, receipt, contra, journal] =
        await Promise.all([
          prisma.salesLedgerEntry.findMany({
            where: { ledgerId, salesVoucher: currentFilter },
            include: { salesVoucher: true },
          }),
          prisma.purchaseLedgerEntry.findMany({
            where: { ledgerId, purchaseVoucher: currentFilter },
            include: { purchaseVoucher: true },
          }),
          prisma.paymentLedgerEntry.findMany({
            where: { ledgerId, paymentVoucher: currentFilter },
            include: { paymentVoucher: true },
          }),
          prisma.receiptLedgerEntry.findMany({
            where: { ledgerId, receiptVoucher: currentFilter },
            include: { receiptVoucher: true },
          }),
          prisma.contraLedgerEntry.findMany({
            where: { ledgerId, contraVoucher: currentFilter },
            include: { contraVoucher: true },
          }),
          prisma.journalLedgerEntry.findMany({
            where: { ledgerId, journalVoucher: currentFilter },
            include: { journalVoucher: true },
          }),
        ]);

      const formatTx = (entry: any, type: string, vKey: string) => ({
        id: entry.id,
        date: entry[vKey].date.toISOString(),
        voucherNo: entry[vKey].voucherNo.toString(),
        type: type,
        narration: entry[vKey].narration,
        amount: entry.amount,
        voucherId: entry[vKey].id,
        balance: 0,
      });

      const rawTransactions = [
        ...sales.map((e) => formatTx(e, "SALES", "salesVoucher")),
        ...purchase.map((e) => formatTx(e, "PURCHASE", "purchaseVoucher")),
        ...payment.map((e) => formatTx(e, "PAYMENT", "paymentVoucher")),
        ...receipt.map((e) => formatTx(e, "RECEIPT", "receiptVoucher")),
        ...contra.map((e) => formatTx(e, "CONTRA", "contraVoucher")),
        ...journal.map((e) => formatTx(e, "JOURNAL", "journalVoucher")),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let running = openingBalance;
      transactions = rawTransactions.map((t) => {
        running += t.amount;
        return { ...t, balance: running };
      });

      closingBalance = running;
    }
  }

  return (
    <LedgerReportClient
      companyId={companyId} // <--- Added this prop
      ledgers={ledgers}
      transactions={transactions}
      openingBalance={openingBalance}
      closingBalance={closingBalance}
      selectedLedgerId={ledgerId}
      fromDate={from}
      toDate={to}
    />
  );
}
