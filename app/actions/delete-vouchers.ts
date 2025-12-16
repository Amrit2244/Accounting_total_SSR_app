"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBulkVouchers(
  voucherIds: number[],
  companyId: number
) {
  if (!voucherIds || voucherIds.length === 0) {
    return { error: "No items selected" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch vouchers (Optional: Only if you need validation before delete)
      // We don't strictly need to fetch them if we aren't manually updating stock columns.

      // 2. [REMOVED] Stock Reversal Logic
      // Reason: Your StockItem table does not have a 'currentStock' column.
      // By deleting the 'InventoryEntry' records below, the stock count
      // (sum of entries) will automatically be corrected.

      // 3. Delete Dependencies (Inventory & Ledger Entries)
      // This effectively "reverses" the transaction by removing it from history.
      await tx.inventoryEntry.deleteMany({
        where: { voucherId: { in: voucherIds } },
      });

      await tx.voucherEntry.deleteMany({
        where: { voucherId: { in: voucherIds } },
      });

      // 4. Delete the Vouchers
      await tx.voucher.deleteMany({
        where: { id: { in: voucherIds } },
      });
    });

    // Refresh the page data
    revalidatePath(`/companies/${companyId}/vouchers`);
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { error: "Failed to delete vouchers. Check server logs." };
  }
}
