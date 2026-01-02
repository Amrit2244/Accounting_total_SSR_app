import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const ledgerId = parseInt(resolvedParams.id);

    // 1. Auth Check
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = auth.split(" ")[1];
    await jwtVerify(token, encodedKey);

    const { searchParams } = new URL(req.url);
    const companyId = parseInt(searchParams.get("companyId") || "0");

    // 2. Fetch Ledger Info
    const ledger = await prisma.ledger.findUnique({
      where: { id: ledgerId, companyId },
      include: { group: true },
    });

    if (!ledger)
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    // 3. Fetch Entries with Voucher Details (including other ledger entries for Particulars)
    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesLedgerEntry.findMany({
          where: { ledgerId, salesVoucher: { companyId, status: "APPROVED" } },
          include: {
            salesVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
        prisma.purchaseLedgerEntry.findMany({
          where: {
            ledgerId,
            purchaseVoucher: { companyId, status: "APPROVED" },
          },
          include: {
            purchaseVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
        prisma.paymentLedgerEntry.findMany({
          where: {
            ledgerId,
            paymentVoucher: { companyId, status: "APPROVED" },
          },
          include: {
            paymentVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
        prisma.receiptLedgerEntry.findMany({
          where: {
            ledgerId,
            receiptVoucher: { companyId, status: "APPROVED" },
          },
          include: {
            receiptVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
        prisma.contraLedgerEntry.findMany({
          where: { ledgerId, contraVoucher: { companyId, status: "APPROVED" } },
          include: {
            contraVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
        prisma.journalLedgerEntry.findMany({
          where: {
            ledgerId,
            journalVoucher: { companyId, status: "APPROVED" },
          },
          include: {
            journalVoucher: {
              include: { ledgerEntries: { include: { ledger: true } } },
            },
          },
        }),
      ]);

    // 4. Helper to find the "Opposite" Ledger Name (Particulars)
    const getParticulars = (entries: any[], currentLedgerId: number) => {
      const opposite = entries.find((e) => e.ledgerId !== currentLedgerId);
      return opposite ? opposite.ledger.name : "Various";
    };

    // 5. Merge and Format
    let rawEntries = [
      ...sales.map((e) => ({
        date: e.salesVoucher.date,
        vType: "Sales",
        vNo: e.salesVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.salesVoucher.ledgerEntries, ledgerId),
        txid: e.salesVoucher.transactionCode,
      })),
      ...purchase.map((e) => ({
        date: e.purchaseVoucher.date,
        vType: "Purchase",
        vNo: e.purchaseVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.purchaseVoucher.ledgerEntries, ledgerId),
        txid: e.purchaseVoucher.transactionCode,
      })),
      ...payment.map((e) => ({
        date: e.paymentVoucher.date,
        vType: "Payment",
        vNo: e.paymentVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.paymentVoucher.ledgerEntries, ledgerId),
        txid: e.paymentVoucher.transactionCode,
      })),
      ...receipt.map((e) => ({
        date: e.receiptVoucher.date,
        vType: "Receipt",
        vNo: e.receiptVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.receiptVoucher.ledgerEntries, ledgerId),
        txid: e.receiptVoucher.transactionCode,
      })),
      ...contra.map((e) => ({
        date: e.contraVoucher.date,
        vType: "Contra",
        vNo: e.contraVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.contraVoucher.ledgerEntries, ledgerId),
        txid: e.contraVoucher.transactionCode,
      })),
      ...journal.map((e) => ({
        date: e.journalVoucher.date,
        vType: "Journal",
        vNo: e.journalVoucher.voucherNo,
        amount: e.amount,
        particulars: getParticulars(e.journalVoucher.ledgerEntries, ledgerId),
        txid: e.journalVoucher.transactionCode,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 6. Calculate Running Balance
    let runningBalance = ledger.openingBalance || 0;
    const entriesWithBalance = rawEntries.map((entry) => {
      runningBalance += entry.amount;
      return {
        ...entry,
        balance: runningBalance,
        displayAmount: Math.abs(entry.amount),
        type: entry.amount < 0 ? "Dr" : "Cr",
      };
    });

    return NextResponse.json({
      success: true,
      ledgerName: ledger.name,
      openingBalance: ledger.openingBalance,
      currentBalance: runningBalance,
      entries: entriesWithBalance,
    });
  } catch (error) {
    console.error("Statement API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statement" },
      { status: 500 }
    );
  }
}
