"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. Validation Schemas
// ==========================================

const LedgerSchema = z.object({
  name: z.string().min(1, "Ledger name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  openingBalance: z.coerce.number().default(0),
  companyId: z.coerce.number(),
});

const StockGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  companyId: z.coerce.number(),
  // Add parentId here if your stock groups are hierarchical
});

// ==========================================
// 2. Types
// ==========================================
export type State = {
  errors?: {
    name?: string[];
    groupId?: string[];
    openingBalance?: string[];
    companyId?: string[];
  };
  message?: string | null;
};

// ==========================================
// 3. Create Actions
// ==========================================

export async function createLedger(prevState: State, formData: FormData) {
  const validatedFields = LedgerSchema.safeParse({
    name: formData.get("name"),
    groupId: formData.get("groupId"),
    openingBalance: formData.get("openingBalance"),
    companyId: formData.get("companyId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Ledger.",
    };
  }

  const { name, groupId, openingBalance, companyId } = validatedFields.data;

  try {
    await prisma.ledger.create({
      data: { name, groupId, openingBalance, companyId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Ledger." };
  }

  revalidatePath(`/companies/${companyId}/ledgers`);
  redirect(`/companies/${companyId}/ledgers`);
}

// --- NEW FUNCTION ADDED HERE ---
export async function createStockGroup(prevState: State, formData: FormData) {
  const validatedFields = StockGroupSchema.safeParse({
    name: formData.get("name"),
    companyId: formData.get("companyId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Stock Group.",
    };
  }

  const { name, companyId } = validatedFields.data;

  try {
    // Ensure your Prisma model is named 'stockGroup' (case sensitive)
    await prisma.stockGroup.create({
      data: { name, companyId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Stock Group." };
  }

  revalidatePath(`/companies/${companyId}/inventory/groups`);
  redirect(`/companies/${companyId}/inventory/groups`);
}

// ==========================================
// 4. Delete Actions
// ==========================================

export async function deleteLedger(id: number) {
  try {
    const deletedLedger = await prisma.ledger.delete({ where: { id } });
    revalidatePath(`/companies/${deletedLedger.companyId}/ledgers`);
    return { message: "Ledger deleted successfully" };
  } catch (error) {
    return { message: "Failed to delete ledger" };
  }
}

export async function deleteStockItem(id: number) {
  try {
    const deletedItem = await prisma.stockItem.delete({ where: { id } });
    revalidatePath(`/companies/${deletedItem.companyId}/inventory`);
    return { message: "Item deleted successfully" };
  } catch (error) {
    return { message: "Failed to delete item" };
  }
}

// Add this to app/actions/masters.ts

const StockItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  openingBalance: z.coerce.number().default(0),
  companyId: z.coerce.number(),
});

export async function createStockItem(prevState: State, formData: FormData) {
  const validatedFields = StockItemSchema.safeParse({
    name: formData.get("name"),
    groupId: formData.get("groupId"),
    openingBalance: formData.get("openingBalance"),
    companyId: formData.get("companyId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Item.",
    };
  }

  const { name, groupId, openingBalance, companyId } = validatedFields.data;

  try {
    await prisma.stockItem.create({
      data: {
        name,
        groupId,
        quantity: openingBalance, // Ensure your DB field is 'quantity' or 'openingBalance'
        companyId,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Item." };
  }

  revalidatePath(`/companies/${companyId}/inventory`);
  redirect(`/companies/${companyId}/inventory`);
}
// ... existing imports

const UnitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  companyId: z.coerce.number(),
});

export async function createUnit(prevState: State, formData: FormData) {
  const validatedFields = UnitSchema.safeParse({
    name: formData.get("name"),
    symbol: formData.get("symbol"),
    companyId: formData.get("companyId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields.",
    };
  }

  const { name, symbol, companyId } = validatedFields.data;

  try {
    // Ensure your Prisma model is named 'Unit' (or 'unit')
    await prisma.unit.create({
      data: { name, symbol, companyId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Failed to Create Unit." };
  }

  revalidatePath(`/companies/${companyId}/inventory/units`);
  redirect(`/companies/${companyId}/inventory/units`);
}
// app/actions/masters.ts

// ... (keep your existing imports and create/delete functions) ...

const UpdateStockItemSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, "Item name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  openingBalance: z.coerce.number().default(0),
  companyId: z.coerce.number(),
});

export async function updateStockItem(prevState: State, formData: FormData) {
  const validatedFields = UpdateStockItemSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    groupId: formData.get("groupId"),
    openingBalance: formData.get("openingBalance"),
    companyId: formData.get("companyId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Item.",
    };
  }

  const { id, name, groupId, openingBalance, companyId } = validatedFields.data;

  try {
    await prisma.stockItem.update({
      where: { id },
      data: {
        name,
        groupId,
        quantity: openingBalance, // Ensure this matches your DB field (quantity or openingBalance)
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Update Item." };
  }

  revalidatePath(`/companies/${companyId}/inventory`);
  redirect(`/companies/${companyId}/inventory`);
}

// ... existing code ...

// NEW: Bulk Delete Action
export async function deleteBulkStockItems(ids: number[]) {
  try {
    if (ids.length === 0) return { message: "No items selected" };

    // Get the company ID from the first item to revalidate the correct path
    const firstItem = await prisma.stockItem.findUnique({
      where: { id: ids[0] },
      select: { companyId: true },
    });

    await prisma.stockItem.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    if (firstItem) {
      revalidatePath(`/companies/${firstItem.companyId}/inventory`);
    }

    return { message: "Selected items deleted successfully" };
  } catch (error) {
    console.error("Bulk delete error:", error);
    return { message: "Failed to delete items" };
  }
}
