import { prisma } from "@/lib/prisma";
import LedgerPrintTemplate from "@/components/reports/LedgerPrintTemplate";
import { notFound } from "next/navigation";

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

  if (!ledgerId) return notFound();

  const lid = parseInt(ledgerId);
  const ledger = await prisma.ledger.findUnique({
    where: { id: lid },
    include: { group: true },
  });
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!ledger || !company) return notFound();

  const today = new Date();
  const currentYear =
    today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const fromDate = new Date(from || `${currentYear}-04-01`);
  const toDateEnd = new Date(to || today.toISOString().split("T")[0]);
  toDateEnd.setHours(23, 59, 59, 999);

  // --- 1. Calculate Opening Balance ---
  const prevFilter = { date: { lt: fromDate }, status: "APPROVED" };
  const prevMovement = await Promise.all([
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

  const totalPrevMovement = prevMovement.reduce(
    (acc, curr) => acc + (curr._sum.amount || 0),
    0
  );
  const openingBalanceAtDate = ledger.openingBalance + totalPrevMovement;

  // --- 2. Fetch Transactions ---
  const currentFilter = {
    date: { gte: fromDate, lte: toDateEnd },
    status: "APPROVED",
  };

  const includeEverything = (vKey: string) => ({
    [vKey]: {
      include: {
        ledgerEntries: {
          include: { ledger: { select: { name: true } } },
        },
      },
    },
  });

  const [sales, purchase, payment, receipt, contra, journal] =
    await Promise.all([
      prisma.salesLedgerEntry.findMany({
        where: { ledgerId: lid, salesVoucher: currentFilter },
        include: includeEverything("salesVoucher"),
      }),
      prisma.purchaseLedgerEntry.findMany({
        where: { ledgerId: lid, purchaseVoucher: currentFilter },
        include: includeEverything("purchaseVoucher"),
      }),
      prisma.paymentLedgerEntry.findMany({
        where: { ledgerId: lid, paymentVoucher: currentFilter },
        include: includeEverything("paymentVoucher"),
      }),
      prisma.receiptLedgerEntry.findMany({
        where: { ledgerId: lid, receiptVoucher: currentFilter },
        include: includeEverything("receiptVoucher"),
      }),
      prisma.contraLedgerEntry.findMany({
        where: { ledgerId: lid, contraVoucher: currentFilter },
        include: includeEverything("contraVoucher"),
      }),
      prisma.journalLedgerEntry.findMany({
        where: { ledgerId: lid, journalVoucher: currentFilter },
        include: includeEverything("journalVoucher"),
      }),
    ]);

  // --- 3. Format Transactions ---
  const formatTx = (entry: any, type: string, vKey: string) => {
    const voucher = entry[vKey];
    const allEntries = voucher.ledgerEntries || [];
    const oppositeEntry = allEntries.find((le: any) => le.ledgerId !== lid);
    const particularsName =
      oppositeEntry?.ledger?.name || voucher.partyName || type;

    return {
      id: entry.id,
      date: voucher.date,
      voucherNo: voucher.voucherNo.toString(),
      type: type,
      particulars: particularsName,
      narration: voucher.narration,
      amount: entry.amount,
      debit: entry.amount < 0 ? Math.abs(entry.amount) : 0,
      credit: entry.amount > 0 ? Math.abs(entry.amount) : 0,
    };
  };

  const transactions = [
    ...sales.map((e) => formatTx(e, "SALES", "salesVoucher")),
    ...purchase.map((e) => formatTx(e, "PURCHASE", "purchaseVoucher")),
    ...payment.map((e) => formatTx(e, "PAYMENT", "paymentVoucher")),
    ...receipt.map((e) => formatTx(e, "RECEIPT", "receiptVoucher")),
    ...contra.map((e) => formatTx(e, "CONTRA", "contraVoucher")),
    ...journal.map((e) => formatTx(e, "JOURNAL", "journalVoucher")),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative min-h-screen bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          /* 1. NUCLEAR RESET: Force unlock all scrollable parents */
          html, body, #__next, #root, main, div, section {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            overflow-y: visible !important;
            position: static !important; /* Removes relative/fixed positioning that clips content */
            display: block !important;
          }

          /* 2. Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* 3. Show ONLY the print zone */
          #print-zone, #print-zone * {
            visibility: visible !important;
          }

          /* 4. Position the print zone absolute to the Page (not the parent) */
          #print-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            z-index: 99999;
          }

          /* 5. Hide User Interface elements */
          nav, aside, footer, header, .no-print {
            display: none !important;
          }

          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `,
        }}
      />

      <div id="print-zone">
        <LedgerPrintTemplate
          company={company}
          ledger={ledger}
          transactions={transactions}
          openingBalance={openingBalanceAtDate}
          fromDate={fromDate}
          toDate={toDateEnd}
        />
      </div>
    </div>
  );
}
