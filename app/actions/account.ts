"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBulkLedgers(ids: number[], companyId: number) {
  try {
    await prisma.ledger.deleteMany({ where: { id: { in: ids }, companyId } });
    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true };
  } catch {
    return { error: "Delete failed (transactions exist?)" };
  }
}

export async function deleteBulkVouchers(
  ids: number[],
  companyId: number,
  type: string
) {
  try {
    if (type === "SALES")
      await prisma.salesVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });
    else if (type === "PURCHASE")
      await prisma.purchaseVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });
    else if (type === "PAYMENT")
      await prisma.paymentVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });
    else if (type === "RECEIPT")
      await prisma.receiptVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });
    else if (type === "CONTRA")
      await prisma.contraVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });
    else if (type === "JOURNAL")
      await prisma.journalVoucher.deleteMany({
        where: { id: { in: ids }, companyId },
      });

    revalidatePath(`/companies/${companyId}/vouchers`);
    return { success: true };
  } catch {
    return { error: "Delete failed" };
  }
}
