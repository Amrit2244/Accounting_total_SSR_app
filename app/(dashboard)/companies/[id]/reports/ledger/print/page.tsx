import { prisma } from "@/lib/prisma";
import LedgerPrintTemplate from "@/components/reports/LedgerPrintTemplate";

type Transaction = {
  id: number;
  date: Date;
  voucherNo: string;
  type: string;
  narration: string | null;
  amount: number;
};

export default async function LedgerPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { ledgerId, from, to } = await searchParams;
  const companyId = parseInt(id);

  if (!ledgerId) {
    return <div className="p-10 text-center font-bold">No Ledger Selected</div>;
  }

  const lid = parseInt(ledgerId);
  const ledger = await prisma.ledger.findUnique({ where: { id: lid } });
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!ledger) return <div className="p-10 text-center">Ledger not found.</div>;

  // --- Date Logic ---
  const today = new Date();
  const currentYear =
    today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const fromStr = from || `${currentYear}-04-01`;
  const toStr = to || today.toISOString().split("T")[0];

  const fromDate = new Date(fromStr);
  const toDateEnd = new Date(toStr);
  toDateEnd.setHours(23, 59, 59, 999);

  // --- 1. Calculate Previous Balance ---
  const prevFilter = { date: { lt: fromDate }, status: "APPROVED" };

  const [prevSales, prevPur, prevPay, prevRcpt, prevCntr, prevJrnl] =
    await Promise.all([
      prisma.salesLedgerEntry.aggregate({
        where: { ledgerId: lid, salesVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.purchaseLedgerEntry.aggregate({
        where: { ledgerId: lid, purchaseVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.paymentLedgerEntry.aggregate({
        where: { ledgerId: lid, paymentVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.receiptLedgerEntry.aggregate({
        where: { ledgerId: lid, receiptVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.contraLedgerEntry.aggregate({
        where: { ledgerId: lid, contraVoucher: prevFilter },
        _sum: { amount: true },
      }),
      prisma.journalLedgerEntry.aggregate({
        where: { ledgerId: lid, journalVoucher: prevFilter },
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

  const openingBalance = ledger.openingBalance + totalPrevMovement;

  // --- 2. Fetch Current Transactions ---
  const currentFilter = {
    date: { gte: fromDate, lte: toDateEnd },
    status: "APPROVED",
  };

  const [sales, purchase, payment, receipt, contra, journal] =
    await Promise.all([
      prisma.salesLedgerEntry.findMany({
        where: { ledgerId: lid, salesVoucher: currentFilter },
        include: { salesVoucher: true },
      }),
      prisma.purchaseLedgerEntry.findMany({
        where: { ledgerId: lid, purchaseVoucher: currentFilter },
        include: { purchaseVoucher: true },
      }),
      prisma.paymentLedgerEntry.findMany({
        where: { ledgerId: lid, paymentVoucher: currentFilter },
        include: { paymentVoucher: true },
      }),
      prisma.receiptLedgerEntry.findMany({
        where: { ledgerId: lid, receiptVoucher: currentFilter },
        include: { receiptVoucher: true },
      }),
      prisma.contraLedgerEntry.findMany({
        where: { ledgerId: lid, contraVoucher: currentFilter },
        include: { contraVoucher: true },
      }),
      prisma.journalLedgerEntry.findMany({
        where: { ledgerId: lid, journalVoucher: currentFilter },
        include: { journalVoucher: true },
      }),
    ]);

  const formatTx = (entry: any, type: string, vKey: string): Transaction => ({
    id: entry.id,
    date: entry[vKey].date,
    voucherNo: entry[vKey].voucherNo.toString(),
    type: type,
    narration: entry[vKey].narration,
    amount: entry.amount,
  });

  const transactions = [
    ...sales.map((e: any) => formatTx(e, "SALES", "salesVoucher")),
    ...purchase.map((e: any) => formatTx(e, "PURCHASE", "purchaseVoucher")),
    ...payment.map((e: any) => formatTx(e, "PAYMENT", "paymentVoucher")),
    ...receipt.map((e: any) => formatTx(e, "RECEIPT", "receiptVoucher")),
    ...contra.map((e: any) => formatTx(e, "CONTRA", "contraVoucher")),
    ...journal.map((e: any) => formatTx(e, "JOURNAL", "journalVoucher")),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <LedgerPrintTemplate
      company={company}
      ledger={ledger}
      transactions={transactions}
      openingBalance={openingBalance}
      fromDate={fromDate}
      toDate={toDateEnd}
    />
  );
}
