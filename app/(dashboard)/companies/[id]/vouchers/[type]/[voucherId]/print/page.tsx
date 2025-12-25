import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoucherPrintTemplate from "./VoucherPrintTemplate";

export default async function PrintVoucherPage({
  params,
}: {
  params: Promise<{ id: string; type: string; voucherId: string }>;
}) {
  const { id, type, voucherId } = await params;
  const companyId = parseInt(id);
  const vId = parseInt(voucherId);
  const t = type.toUpperCase();

  const baseRel = {
    company: true,
    ledgerEntries: { include: { ledger: { include: { group: true } } } },
    createdBy: true,
    verifiedBy: true,
  };

  const inventoryRel = {
    ...baseRel,
    inventoryEntries: { include: { stockItem: { include: { unit: true } } } },
  };

  let voucher: any = null;

  // Added try-catch for extra safety
  try {
    if (t === "SALES")
      voucher = await prisma.salesVoucher.findUnique({
        where: { id: vId },
        include: inventoryRel,
      });
    else if (t === "PURCHASE")
      voucher = await prisma.purchaseVoucher.findUnique({
        where: { id: vId },
        include: inventoryRel,
      });
    else if (t === "PAYMENT")
      voucher = await prisma.paymentVoucher.findUnique({
        where: { id: vId },
        include: baseRel,
      });
    else if (t === "RECEIPT")
      voucher = await prisma.receiptVoucher.findUnique({
        where: { id: vId },
        include: baseRel,
      });
    else if (t === "JOURNAL")
      voucher = await prisma.journalVoucher.findUnique({
        where: { id: vId },
        include: baseRel,
      });
    else if (t === "CONTRA")
      voucher = await prisma.contraVoucher.findUnique({
        where: { id: vId },
        include: baseRel,
      });
  } catch (e) {
    console.error("Database fetch error:", e);
  }

  // ✅ CRITICAL: If no voucher is found, return notFound() immediately
  if (!voucher) return notFound();

  return (
    <div className="bg-white min-h-screen">
      <VoucherPrintTemplate voucher={voucher} type={t} />
    </div>
  );
}
