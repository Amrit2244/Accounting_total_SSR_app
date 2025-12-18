"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export type State = {
  errors?: { [key: string]: string[] };
  message?: string | null;
  success?: boolean;
};

// --- AUTH HELPER ---
async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch (error) {
    return null;
  }
}

// ==========================================
// 1. Validation Schemas
// ==========================================

const LedgerSchema = z.object({
  name: z.string().min(1, "Ledger name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  openingBalance: z.coerce.number().default(0),
  balanceType: z.string().optional(),
  companyId: z.coerce.number(),
  tallyName: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  state: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  gstin: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  address: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

const UpdateLedgerSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, "Ledger name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  openingBalance: z.coerce.number().default(0),
  balanceType: z.string().optional(),
  gstin: z
    .string()
    .nullable()
    .optional()
    .transform((e) => (e === "" ? null : e)),
  state: z
    .string()
    .nullable()
    .optional()
    .transform((e) => (e === "" ? null : e)),
  companyId: z.coerce.number(),
});

const StockGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  parentId: z.coerce.number().optional().nullable(),
  companyId: z.coerce.number(),
});

const StockItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  partNumber: z.string().optional(),
  openingQty: z.coerce.number().default(0),
  openingRate: z.coerce.number().default(0),
  companyId: z.coerce.number(),
});

const UnitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  companyId: z.coerce.number(),
});

const VoucherEntrySchema = z.object({
  ledgerId: z.coerce.number().min(1),
  amount: z.coerce.number(),
});

const UpdateVoucherSchema = z.object({
  voucherId: z.coerce.number(),
  companyId: z.coerce.number(),
  date: z.string().min(1),
  narration: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  structuredEntries: z
    .string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    })
    .pipe(z.array(VoucherEntrySchema).min(2)),
  structuredInventory: z
    .string()
    .optional()
    .transform((str) => (str ? JSON.parse(str) : [])),
});

// ==========================================
// 2. Create Actions
// ==========================================

export async function createLedger(prevState: State, formData: FormData) {
  const validatedFields = LedgerSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields.",
      success: false,
    };

  const {
    name,
    groupId,
    openingBalance,
    balanceType,
    companyId,
    tallyName,
    state,
    gstin,
    address,
  } = validatedFields.data;
  let finalBalance =
    balanceType === "Cr" ? -Math.abs(openingBalance) : Math.abs(openingBalance);

  try {
    await prisma.ledger.create({
      data: {
        name,
        groupId,
        openingBalance: finalBalance,
        companyId,
        tallyName,
        state,
        gstin,
        address,
      },
    });
    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true, message: "Ledger created successfully" };
  } catch (error) {
    return { message: "Database Error.", success: false };
  }
}

export async function createStockGroup(prevState: State, formData: FormData) {
  const validatedFields = StockGroupSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };

  try {
    await prisma.stockGroup.create({ data: validatedFields.data });
    revalidatePath(
      `/companies/${validatedFields.data.companyId}/inventory/groups`
    );
    return { success: true, message: "Stock Group created" };
  } catch (error) {
    return { message: "Database Error.", success: false };
  }
}

export async function createUnit(prevState: State, formData: FormData) {
  const validatedFields = UnitSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };

  try {
    await prisma.unit.create({ data: validatedFields.data });
    revalidatePath(
      `/companies/${validatedFields.data.companyId}/inventory/units`
    );
    return { success: true, message: "Unit created" };
  } catch (error) {
    return { message: "Failed to Create Unit.", success: false };
  }
}

export async function createStockItem(prevState: State, formData: FormData) {
  const validatedFields = StockItemSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };

  const data = validatedFields.data;
  try {
    await prisma.stockItem.create({
      data: {
        ...data,
        quantity: data.openingQty,
        openingBalance: data.openingQty,
        openingValue: data.openingQty * data.openingRate,
      },
    });
    revalidatePath(`/companies/${data.companyId}/inventory`);
    return { success: true, message: "Item created" };
  } catch (error) {
    return { message: "Database Error.", success: false };
  }
}

// ==========================================
// 3. Update Actions
// ==========================================

export async function updateLedger(prevState: State, formData: FormData) {
  const validatedFields = UpdateLedgerSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };

  const {
    id,
    name,
    groupId,
    openingBalance,
    balanceType,
    gstin,
    state,
    companyId,
  } = validatedFields.data;
  let finalBalance =
    balanceType === "Cr" ? -Math.abs(openingBalance) : Math.abs(openingBalance);

  try {
    await prisma.ledger.update({
      where: { id },
      data: { name, groupId, openingBalance: finalBalance, gstin, state },
    });
    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true, message: "Ledger updated" };
  } catch (error) {
    return { message: "Database Error.", success: false };
  }
}

/**
 * UPDATED: updateVoucher handles TXID generation, Status Reset,
 * Accounting entries, AND Inventory items with Dirty Checking.
 */
export async function updateVoucher(prevState: State, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = UpdateVoucherSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation Error",
      success: false,
    };
  }

  const {
    voucherId,
    companyId,
    date,
    narration,
    structuredEntries,
    structuredInventory,
  } = validatedFields.data;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId)
      return { success: false, message: "Unauthorized. Session expired." };

    // Fetch current state for dirty check and comparison
    const current = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { entries: true, inventory: true },
    });

    if (!current) return { success: false, message: "Voucher not found." };

    // --- DIRTY CHECK LOGIC ---
    const normalizeAccounting = (arr: any[]) =>
      JSON.stringify(
        arr
          .map((e) => ({
            lid: Number(e.ledgerId),
            amt: Number(e.amount).toFixed(2),
          }))
          .sort((a, b) => a.lid - b.lid)
      );

    const normalizeInventory = (arr: any[]) =>
      JSON.stringify(
        arr
          .map((i) => ({
            sid: Number(i.stockItemId),
            qty: Number(i.quantity).toFixed(2),
            rate: Number(i.rate).toFixed(2),
          }))
          .sort((a, b) => a.sid - b.sid)
      );

    const isDateSame =
      new Date(date).toISOString().split("T")[0] ===
      new Date(current.date).toISOString().split("T")[0];
    const isNarrationSame = (current.narration || "") === (narration || "");
    const isAccountingSame =
      normalizeAccounting(structuredEntries) ===
      normalizeAccounting(current.entries);
    const isInventorySame =
      normalizeInventory(structuredInventory) ===
      normalizeInventory(current.inventory);

    if (isDateSame && isNarrationSame && isAccountingSame && isInventorySame) {
      return {
        success: true,
        message: "Voucher is already up to date. No changes detected.",
      };
    }

    // --- PROCEED WITH UPDATE ---
    const newTxCode = Math.floor(10000 + Math.random() * 90000).toString();

    // Fetch item names to satisfy schema requirement
    const itemIds = structuredInventory.map((i: any) => Number(i.stockItemId));
    const stockItemsMaster = await prisma.stockItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update main voucher record
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          date: new Date(date),
          narration: narration,
          status: "PENDING", // Always reset to pending on edit
          transactionCode: newTxCode,
          updatedAt: new Date(),
          createdById: currentUserId,
          verifiedById: null,
          totalAmount: structuredEntries.reduce(
            (sum: number, e: any) => sum + (e.amount > 0 ? e.amount : 0),
            0
          ),
        },
      });

      // 2. Sync Ledger Entries
      await tx.voucherEntry.deleteMany({ where: { voucherId } });
      await tx.voucherEntry.createMany({
        data: structuredEntries.map((e: any) => ({
          voucherId: voucherId,
          ledgerId: Number(e.ledgerId),
          amount: Number(e.amount),
        })),
      });

      // 3. Sync Inventory Entries (WITH itemName FIX)
      await tx.inventoryEntry.deleteMany({ where: { voucherId } });
      if (structuredInventory.length > 0) {
        await tx.inventoryEntry.createMany({
          data: structuredInventory.map((i: any) => {
            const itemMaster = stockItemsMaster.find(
              (si) => si.id === Number(i.stockItemId)
            );
            return {
              voucherId: voucherId,
              stockItemId: Number(i.stockItemId),
              itemName: itemMaster?.name || "Unknown Item",
              quantity: Number(i.quantity),
              rate: Number(i.rate),
              amount: Number(i.quantity) * Number(i.rate),
            };
          }),
        });
      }
    });

    revalidatePath(`/companies/${companyId}/vouchers`);
    revalidatePath(`/companies/${companyId}/reports/ledger`);

    return {
      success: true,
      message: `Transaction updated and sent for verification. Ref: ${newTxCode}`,
    };
  } catch (error: any) {
    console.error("Voucher Update Error:", error);
    return { success: false, message: "Database Error: " + error.message };
  }
}

export async function updateStockItem(prevState: State, formData: FormData) {
  const validatedFields = StockItemSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };

  const { id } = Object.fromEntries(formData) as any;
  try {
    await prisma.stockItem.update({
      where: { id: parseInt(id) },
      data: validatedFields.data,
    });
    revalidatePath(`/companies/${validatedFields.data.companyId}/inventory`);
    return { success: true, message: "Item updated successfully" };
  } catch (error) {
    return { message: "Database Error.", success: false };
  }
}

// ==========================================
// 4. Delete & Bulk Actions
// ==========================================

export async function deleteBulkLedgers(ids: number[], companyId: number) {
  try {
    const hasTransactions = await prisma.voucherEntry.findFirst({
      where: { ledgerId: { in: ids } },
    });
    if (hasTransactions)
      return {
        success: false,
        message: "Cannot delete ledgers with transaction history.",
      };

    await prisma.ledger.deleteMany({
      where: { id: { in: ids }, companyId: companyId },
    });
    revalidatePath(`/companies/${companyId}/ledgers`);
    return { success: true, message: "Selected ledgers deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete ledgers." };
  }
}

export async function deleteBulkVouchers(ids: number[], companyId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.voucherEntry.deleteMany({ where: { voucherId: { in: ids } } });
      await tx.inventoryEntry.deleteMany({ where: { voucherId: { in: ids } } });
      await tx.voucher.deleteMany({ where: { id: { in: ids }, companyId } });
    });
    revalidatePath(`/companies/${companyId}/vouchers`);
    return { success: true, message: "Vouchers deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete vouchers." };
  }
}

export async function deleteLedger(id: number) {
  try {
    const deletedLedger = await prisma.ledger.delete({ where: { id } });
    revalidatePath(`/companies/${deletedLedger.companyId}/ledgers`);
    return { message: "Ledger deleted successfully" };
  } catch (error) {
    return { message: "Failed to delete ledger" };
  }
}

export async function deleteBulkStockItems(ids: number[]) {
  try {
    if (ids.length === 0) return { message: "No items selected" };
    const firstItem = await prisma.stockItem.findUnique({
      where: { id: ids[0] },
      select: { companyId: true },
    });
    await prisma.stockItem.deleteMany({ where: { id: { in: ids } } });
    if (firstItem)
      revalidatePath(`/companies/${firstItem.companyId}/inventory`);
    return { message: "Selected items deleted successfully" };
  } catch (error) {
    return { message: "Failed to delete items" };
  }
}

export async function deleteStockItem(id: number) {
  try {
    const deletedItem = await prisma.stockItem.delete({ where: { id } });
    revalidatePath(`/companies/${deletedItem.companyId}/inventory`);
    return { success: true, message: "Item deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete item." };
  }
}
