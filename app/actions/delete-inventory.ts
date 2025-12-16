"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBulkStockItems(
  itemIds: number[],
  companyId: number
) {
  if (!itemIds || itemIds.length === 0) return { error: "No items selected" };

  try {
    await prisma.stockItem.deleteMany({
      where: {
        id: { in: itemIds },
        companyId: companyId,
      },
    });

    revalidatePath(`/companies/${companyId}/inventory`);
    return { success: true, message: `Deleted ${itemIds.length} items.` };
  } catch (error) {
    console.error("Delete Error:", error);
    return { error: "Failed to delete items." };
  }
}
