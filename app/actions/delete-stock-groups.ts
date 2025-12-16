"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBulkStockGroups(
  groupIds: number[],
  companyId: number
) {
  if (!groupIds || groupIds.length === 0)
    return { error: "No groups selected" };

  try {
    // Note: This might fail if the Group has children (Items or other Groups).
    // You usually need to delete items first.
    await prisma.stockGroup.deleteMany({
      where: {
        id: { in: groupIds },
        companyId: companyId,
      },
    });

    revalidatePath(`/companies/${companyId}/inventory/groups`);
    return { success: true, message: `Deleted ${groupIds.length} groups.` };
  } catch (error) {
    console.error("Delete Error:", error);
    return {
      error: "Cannot delete Groups that contain Items. Delete Items first.",
    };
  }
}
