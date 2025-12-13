"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBankDate(entryId: number, date: string | null) {
  try {
    const entry = await prisma.voucherEntry.findUnique({
      where: { id: entryId },
      include: { voucher: true },
    });

    if (!entry) return { error: "Entry not found" };

    await prisma.voucherEntry.update({
      where: { id: entryId },
      data: {
        bankDate: date ? new Date(date) : null,
      },
    });

    revalidatePath(`/companies/${entry.voucher.companyId}/banking/brs`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to update bank date" };
  }
}
