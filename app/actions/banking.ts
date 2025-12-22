"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ✅ UPDATED: Accepts 'type' to know which table to update
export async function updateBankDate(
  type: string,
  entryId: number,
  date: string | null
) {
  try {
    const bankDate = date ? new Date(date) : null;
    let companyId: number | null = null;

    // Switch based on voucher type to update the correct table
    switch (type) {
      case "SALES":
        const s = await prisma.salesLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { salesVoucher: true },
        });
        companyId = s.salesVoucher.companyId;
        break;

      case "PURCHASE":
        const p = await prisma.purchaseLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { purchaseVoucher: true },
        });
        companyId = p.purchaseVoucher.companyId;
        break;

      case "PAYMENT":
        const pay = await prisma.paymentLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { paymentVoucher: true },
        });
        companyId = pay.paymentVoucher.companyId;
        break;

      case "RECEIPT":
        const r = await prisma.receiptLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { receiptVoucher: true },
        });
        companyId = r.receiptVoucher.companyId;
        break;

      case "CONTRA":
        const c = await prisma.contraLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { contraVoucher: true },
        });
        companyId = c.contraVoucher.companyId;
        break;

      case "JOURNAL":
        const j = await prisma.journalLedgerEntry.update({
          where: { id: entryId },
          data: { bankDate },
          include: { journalVoucher: true },
        });
        companyId = j.journalVoucher.companyId;
        break;

      default:
        return { error: "Invalid Voucher Type" };
    }

    if (companyId) {
      revalidatePath(`/companies/${companyId}/banking/brs`);
    }

    return { success: true };
  } catch (e) {
    console.error("Update Bank Date Error:", e);
    return { error: "Failed to update bank date" };
  }
}
