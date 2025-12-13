"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. CREATE LEDGER
// ==========================================
const CreateLedgerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  groupId: z.string().min(1, "Parent Group is required"),
  openingBalance: z.string().optional(),
  openingType: z.enum(["Dr", "Cr"]).optional(),
  companyId: z.string(),
});

export async function createLedger(prevState: any, formData: FormData) {
  const result = CreateLedgerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, groupId, openingBalance, openingType, companyId } = result.data;
  const cid = parseInt(companyId);

  // Balance Logic
  let balance = parseFloat(openingBalance || "0");
  if (openingType === "Cr") {
    balance = -Math.abs(balance);
  } else {
    balance = Math.abs(balance);
  }

  try {
    const existing = await prisma.ledger.findFirst({
      where: { name, companyId: cid },
    });

    if (existing)
      return { error: "Ledger name already exists in this company." };

    await prisma.ledger.create({
      data: {
        name,
        groupId: parseInt(groupId),
        companyId: cid,
        openingBalance: balance,
      },
    });
  } catch (e) {
    return { error: "Failed to create ledger." };
  }

  const path = `/companies/${cid}/ledgers`;
  revalidatePath(path);
  redirect(path);
}

// ==========================================
// 2. DELETE LEDGER
// ==========================================
export async function deleteLedger(ledgerId: number, companyId: number) {
  try {
    const count = await prisma.voucherEntry.count({ where: { ledgerId } });

    if (count > 0) {
      return { error: "Cannot delete ledger. It has existing transactions." };
    }

    await prisma.ledger.delete({ where: { id: ledgerId } });

    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete ledger" };
  }
}

// ==========================================
// 3. UPDATE LEDGER
// ==========================================
const UpdateLedgerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  groupId: z.string().min(1),
  openingBalance: z.string().optional(),
  openingType: z.enum(["Dr", "Cr"]).optional(),
  companyId: z.string(),
  gstin: z.string().optional(),
  state: z.string().optional(),
});

export async function updateLedger(prevState: any, formData: FormData) {
  const result = UpdateLedgerSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };

  const {
    id,
    name,
    groupId,
    openingBalance,
    openingType,
    companyId,
    gstin,
    state,
  } = result.data;
  const ledgerId = parseInt(id);
  const cid = parseInt(companyId);

  // Balance Logic
  let balance = parseFloat(openingBalance || "0");
  if (openingType === "Cr") balance = -Math.abs(balance);
  else balance = Math.abs(balance);

  try {
    // Check for duplicate name (Excluding current ledger)
    const existing = await prisma.ledger.findFirst({
      where: { name, companyId: cid, NOT: { id: ledgerId } },
    });

    if (existing) return { error: "Ledger name already exists." };

    await prisma.ledger.update({
      where: { id: ledgerId },
      data: {
        name,
        groupId: parseInt(groupId),
        openingBalance: balance,
        gstin,
        state,
      },
    });
  } catch (e) {
    return { error: "Failed to update ledger" };
  }

  const path = `/companies/${cid}/ledgers`;
  revalidatePath(path);
  redirect(path);
}

// ==========================================
// 4. CREATE STOCK ITEM
// ==========================================
const CreateItemSchema = z.object({
  name: z.string().min(1, "Item Name is required"),
  groupId: z.string().optional(),
  unitId: z.string().optional(),
  gstRate: z.string().optional(),
  companyId: z.string(),
});

export async function createStockItem(prevState: any, formData: FormData) {
  const result = CreateItemSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, groupId, unitId, gstRate, companyId } = result.data;
  const cid = parseInt(companyId);

  try {
    const existing = await prisma.stockItem.findFirst({
      where: { name, companyId: cid },
    });

    if (existing) return { error: "Item name already exists." };

    await prisma.stockItem.create({
      data: {
        name,
        companyId: cid,
        groupId: groupId ? parseInt(groupId) : null,
        unitId: unitId ? parseInt(unitId) : null,
        gstRate: parseFloat(gstRate || "0"),
      },
    });
  } catch (e) {
    return { error: "Failed to create item." };
  }

  const path = `/companies/${cid}/inventory`;
  revalidatePath(path);
  redirect(path);
}

// ==========================================
// 5. DELETE STOCK ITEM
// ==========================================
export async function deleteStockItem(itemId: number, companyId: number) {
  try {
    const count = await prisma.inventoryEntry.count({ where: { itemId } });

    if (count > 0) {
      return { error: "Cannot delete item. It has existing transactions." };
    }

    await prisma.stockItem.delete({ where: { id: itemId } });

    revalidatePath(`/companies/${companyId}/inventory`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete item" };
  }
}

// ==========================================
// 6. UPDATE STOCK ITEM
// ==========================================
const UpdateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  companyId: z.string(),
  gstRate: z.string().optional(),
});

export async function updateStockItem(prevState: any, formData: FormData) {
  const result = UpdateItemSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };

  const { id, name, companyId, gstRate } = result.data;
  const itemId = parseInt(id);
  const cid = parseInt(companyId);

  try {
    const existing = await prisma.stockItem.findFirst({
      where: { name, companyId: cid, NOT: { id: itemId } },
    });

    if (existing) return { error: "Item name already exists." };

    await prisma.stockItem.update({
      where: { id: itemId },
      data: {
        name,
        gstRate: parseFloat(gstRate || "0"),
      },
    });
  } catch (e) {
    return { error: "Failed to update item" };
  }

  const path = `/companies/${cid}/inventory`;
  revalidatePath(path);
  redirect(path);
}
