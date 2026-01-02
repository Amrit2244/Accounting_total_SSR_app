import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth Check
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = auth.split(" ")[1];
    await jwtVerify(token, encodedKey);

    const ledgerId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const companyId = parseInt(searchParams.get("companyId") || "0");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // 2. Fetch Ledger Info
    const ledger = await prisma.ledger.findUnique({
      where: { id: ledgerId, companyId },
      include: { group: true },
    });

    if (!ledger)
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    // 3. Fetch Entries across ALL voucher types (Same as Web Logic)
    // We collect entries from Sales, Purchase, Payment, Receipt, Contra, Journal
    const [sales, purchase, payment, receipt, contra, journal] =
      await Promise.all([
        prisma.salesLedgerEntry.findMany({
          where: { ledgerId, salesVoucher: { companyId, status: "APPROVED" } },
          include: { salesVoucher: true },
        }),
        prisma.purchaseLedgerEntry.findMany({
          where: {
            ledgerId,
            purchaseVoucher: { companyId, status: "APPROVED" },
          },
          include: { purchaseVoucher: true },
        }),
        prisma.paymentLedgerEntry.findMany({
          where: {
            ledgerId,
            paymentVoucher: { companyId, status: "APPROVED" },
          },
          include: { paymentVoucher: true },
        }),
        prisma.receiptLedgerEntry.findMany({
          where: {
            ledgerId,
            receiptVoucher: { companyId, status: "APPROVED" },
          },
          include: { receiptVoucher: true },
        }),
        prisma.contraLedgerEntry.findMany({
          where: { ledgerId, contraVoucher: { companyId, status: "APPROVED" } },
          include: { contraVoucher: true },
        }),
        prisma.journalLedgerEntry.findMany({
          where: {
            ledgerId,
            journalVoucher: { companyId, status: "APPROVED" },
          },
          include: { journalVoucher: true },
        }),
      ]);

    // 4. Uniform Formatting (Tally Convention: Negative = Dr, Positive = Cr)
    const allEntries = [
      ...sales.map((e) => ({
        date: e.salesVoucher.date,
        vType: "Sales",
        vNo: e.salesVoucher.voucherNo,
        amount: e.amount,
        txid: e.salesVoucher.transactionCode,
      })),
      ...purchase.map((e) => ({
        date: e.purchaseVoucher.date,
        vType: "Purchase",
        vNo: e.purchaseVoucher.voucherNo,
        amount: e.amount,
        txid: e.purchaseVoucher.transactionCode,
      })),
      ...payment.map((e) => ({
        date: e.paymentVoucher.date,
        vType: "Payment",
        vNo: e.paymentVoucher.voucherNo,
        amount: e.amount,
        txid: e.paymentVoucher.transactionCode,
      })),
      ...receipt.map((e) => ({
        date: e.receiptVoucher.date,
        vType: "Receipt",
        vNo: e.receiptVoucher.voucherNo,
        amount: e.amount,
        txid: e.receiptVoucher.transactionCode,
      })),
      ...contra.map((e) => ({
        date: e.contraVoucher.date,
        vType: "Contra",
        vNo: e.contraVoucher.voucherNo,
        amount: e.amount,
        txid: e.contraVoucher.transactionCode,
      })),
      ...journal.map((e) => ({
        date: e.journalVoucher.date,
        vType: "Journal",
        vNo: e.journalVoucher.voucherNo,
        amount: e.amount,
        txid: e.journalVoucher.transactionCode,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      ledgerName: ledger.name,
      openingBalance: ledger.openingBalance,
      entries: allEntries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch statement" },
      { status: 500 }
    );
  }
}
