"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBulkLedgers(
  ledgerIds: number[],
  companyId: number
) {
  if (!ledgerIds || ledgerIds.length === 0)
    return { error: "No items selected" };

  try {
    // Attempt to delete. This will fail if Vouchers still exist.
    await prisma.ledger.deleteMany({
      where: {
        id: { in: ledgerIds },
        companyId: companyId,
      },
    });

    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true, message: `Deleted ${ledgerIds.length} ledgers.` };
  } catch (error) {
    console.error("Delete Error:", error);
    return {
      error:
        "Cannot delete Ledgers that have existing Transactions. Delete Vouchers first.",
    };
  }
}
