"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation"; // Add this at the top!

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
  // ✅ FIX: Transform 0, empty string, or NaN into NULL
  parentId: z.coerce
    .number()
    .optional()
    .transform((val) => (val === 0 || isNaN(val || 0) ? null : val)),
  companyId: z.coerce.number(),
});

const StockItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  groupId: z.coerce.number().min(1, "Group is required"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  partNumber: z.string().optional().default(""),
  openingQty: z.coerce.number().default(0),
  openingRate: z.coerce.number().default(0), // Used for calc, removed before DB
  companyId: z.coerce.number(),
  minStock: z.coerce.number().optional().default(0),
  gstRate: z.coerce.number().optional().default(0),
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

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    // validatedFields.data.parentId is now correctly NULL if it was 0
    await prisma.stockGroup.create({
      data: {
        name: validatedFields.data.name,
        companyId: validatedFields.data.companyId,
        parentId: validatedFields.data.parentId, // This will be null or a valid ID
      },
    });

    revalidatePath(
      `/companies/${validatedFields.data.companyId}/inventory/groups`
    );
    return { success: true, message: "Stock Group created successfully" };
  } catch (error: any) {
    console.error("Group Create Error:", error);
    return { message: "Database Error: " + error.message, success: false };
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

// ✅ FIXED: createStockItem with explicit mapping
export async function createStockItem(prevState: State, formData: FormData) {
  const validatedFields = StockItemSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // Destructure to separate 'openingRate' from the data sent to DB
  const { openingRate, ...itemData } = validatedFields.data;

  try {
    await prisma.stockItem.create({
      data: {
        // Explicitly map allowed fields
        name: itemData.name,
        groupId: itemData.groupId,
        unitId: itemData.unitId,
        companyId: itemData.companyId,
        partNumber: itemData.partNumber,
        minStock: itemData.minStock,
        gstRate: itemData.gstRate,

        // Inventory Logic
        openingQty: itemData.openingQty,
        quantity: itemData.openingQty, // Live stock starts equal to opening
        openingValue: itemData.openingQty * openingRate, // Calculate Value here
      },
    });

    revalidatePath(`/companies/${itemData.companyId}/inventory`);
    return { success: true, message: "Item created successfully" };
  } catch (error: any) {
    console.error("Stock Item Create Error:", error);
    return { message: "Database Error: " + error.message, success: false };
  }
}

// ✅ UPDATE: Stock Journal with Maker-Checker Logic
// ... keep existing imports ...

// ✅ 1. STRICT CREATE ACTION (Always Pending)
// In app/actions/masters.ts

// In app/actions/masters.ts

export async function createStockJournal(prevState: any, formData: FormData) {
  const companyId = parseInt(formData.get("companyId") as string);
  const date = new Date(formData.get("date") as string);
  const narration = formData.get("narration") as string;
  const consumption = JSON.parse(
    (formData.get("consumption") as string) || "[]"
  );
  const production = JSON.parse((formData.get("production") as string) || "[]");

  if (consumption.length === 0 && production.length === 0)
    return { error: "Entries missing." };

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    const status = "PENDING"; // Always Pending for Maker-Checker

    const entries: any[] = [];

    // Consumption logic...
    consumption.forEach((i: any) =>
      entries.push({
        stockItemId: parseInt(i.sid),
        quantity: -Math.abs(parseFloat(i.qty)),
        rate: parseFloat(i.rate),
        amount: parseFloat(i.qty) * parseFloat(i.rate),
        isProduction: false,
      })
    );

    // Production logic...
    production.forEach((i: any) =>
      entries.push({
        stockItemId: parseInt(i.sid),
        quantity: Math.abs(parseFloat(i.qty)),
        rate: parseFloat(i.rate),
        amount: parseFloat(i.qty) * parseFloat(i.rate),
        isProduction: true,
      })
    );

    // ✅ FIX: Generate Pure 5-Digit Code (e.g., "49281")
    const randomCode = Math.floor(10000 + Math.random() * 90000).toString();

    await prisma.stockJournal.create({
      data: {
        companyId,
        date,
        // Internal ID can have prefix, but Transaction Code must be pure digits
        voucherNo: "SJ-" + randomCode,
        transactionCode: randomCode, // <--- THIS FIXES THE FORMAT ISSUE
        narration,
        status: status,
        createdById: userId,
        verifiedById: null,
        inventoryEntries: { create: entries },
      },
    });

    revalidatePath(`/companies/${companyId}/inventory`);

    // ✅ SUCCESS MESSAGE: Shows the 5-digit code for verification
    return {
      success: true,
      message: `Stock Journal Posted. TX Code: ${randomCode}`,
    };
  } catch (error: any) {
    console.error("Stock Journal Error:", error);
    return { error: "Failed: " + error.message };
  }
}
// ✅ 2. NEW: VERIFY ACTION (For the Checker to call later)
export async function verifyStockJournal(
  voucherId: number,
  isApproved: boolean
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    const status = isApproved ? "APPROVED" : "REJECTED";

    // 1. Update Status
    const journal = await prisma.stockJournal.update({
      where: { id: voucherId },
      data: {
        status: status,
        verifiedById: userId, // Tracks WHO verified it
      },
      include: { inventoryEntries: true },
    });

    // 2. IF APPROVED: Update Real Stock Quantities
    if (isApproved) {
      await prisma.$transaction(async (tx) => {
        for (const entry of journal.inventoryEntries) {
          await tx.stockItem.update({
            where: { id: entry.stockItemId },
            data: {
              quantity: { increment: entry.quantity }, // Adds production, subtracts consumption
            },
          });
        }
      });
    }

    revalidatePath(`/companies/${journal.companyId}/inventory`);
    return { success: true, message: `Voucher ${status}` };
  } catch (error: any) {
    return { success: false, message: error.message };
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

    const current = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { entries: true, inventory: true },
    });

    if (!current) return { success: false, message: "Voucher not found." };

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
      return { success: true, message: "Voucher is already up to date." };
    }

    const newTxCode = Math.floor(10000 + Math.random() * 90000).toString();
    const itemIds = structuredInventory.map((i: any) => Number(i.stockItemId));
    const stockItemsMaster = await prisma.stockItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          date: new Date(date),
          narration: narration,
          status: "PENDING",
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

      await tx.voucherEntry.deleteMany({ where: { voucherId } });
      await tx.voucherEntry.createMany({
        data: structuredEntries.map((e: any) => ({
          voucherId: voucherId,
          ledgerId: Number(e.ledgerId),
          amount: Number(e.amount),
        })),
      });

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
    return { success: true, message: `Transaction updated. Ref: ${newTxCode}` };
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
  const data = validatedFields.data;

  try {
    // 1. Perform Update
    await prisma.stockItem.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        groupId: data.groupId,
        unitId: data.unitId,
        companyId: data.companyId,
        partNumber: data.partNumber,
        minStock: data.minStock,
        gstRate: data.gstRate,
        openingQty: data.openingQty,
        // Calculate Value
        openingValue: data.openingQty * data.openingRate,
      },
    });
  } catch (error: any) {
    console.error("Update Error:", error);
    return { message: "Database Error: " + error.message, success: false };
  }

  // 2. Revalidate & Redirect (Must be OUTSIDE the try/catch block)
  revalidatePath(`/companies/${data.companyId}/inventory`);
  redirect(`/companies/${data.companyId}/inventory`);
}

// ==========================================
// 4. Delete & Bulk Actions
// ==========================================
// app/actions/masters.ts

export async function deleteBulkLedgers(
  ledgerIds: number[],
  companyId: number
) {
  if (!ledgerIds || ledgerIds.length === 0) {
    return { success: false, message: "No items selected" };
  }

  try {
    // 1. DIRECT DELETE ATTEMPT
    // We removed the manual 'findFirst' check.
    // If Prisma finds constraints, it will throw an error automatically.
    await prisma.ledger.deleteMany({
      where: {
        id: { in: ledgerIds },
        companyId: companyId,
      },
    });

    revalidatePath(`/companies/${companyId}/ledgers`);
    return {
      success: true,
      message: `Successfully deleted ${ledgerIds.length} ledgers.`,
    };
  } catch (error: any) {
    console.error("Delete Error:", error);

    // 2. BETTER ERROR HANDLING
    // Check if the error code P2003 (Foreign Key Constraint) occurred
    if (error.code === "P2003") {
      return {
        success: false,
        message:
          "Cannot delete: This Ledger is used in a Voucher, Stock Item, or Group.",
      };
    }

    return {
      success: false,
      message: "Database Error: " + (error.message || "Unknown error"),
    };
  }
}

// app/actions/masters.ts

// ✅ OPTIMIZED: Groups IDs and deletes in batches to prevent Timeout (P2028)
export async function deleteBulkVouchers(
  items: { id: number; type: string }[],
  companyId: number
) {
  if (!items || items.length === 0) return { error: "No items selected" };

  // 1. Group IDs by Type to avoid looping in DB
  const salesIds = items.filter((i) => i.type === "SALES").map((i) => i.id);
  const purchaseIds = items
    .filter((i) => i.type === "PURCHASE")
    .map((i) => i.id);
  const paymentIds = items.filter((i) => i.type === "PAYMENT").map((i) => i.id);
  const receiptIds = items.filter((i) => i.type === "RECEIPT").map((i) => i.id);
  const contraIds = items.filter((i) => i.type === "CONTRA").map((i) => i.id);
  const journalIds = items.filter((i) => i.type === "JOURNAL").map((i) => i.id);
  const stockJournalIds = items
    .filter((i) => i.type === "STOCK_JOURNAL")
    .map((i) => i.id);

  try {
    // 2. Perform Batch Deletion in a Transaction with increased timeout
    await prisma.$transaction(
      async (tx) => {
        // --- SALES ---
        if (salesIds.length > 0) {
          await tx.salesItemEntry.deleteMany({
            where: { salesId: { in: salesIds } },
          });
          await tx.salesLedgerEntry.deleteMany({
            where: { salesId: { in: salesIds } },
          });
          await tx.salesVoucher.deleteMany({ where: { id: { in: salesIds } } });
        }

        // --- PURCHASE ---
        if (purchaseIds.length > 0) {
          await tx.purchaseItemEntry.deleteMany({
            where: { purchaseId: { in: purchaseIds } },
          });
          await tx.purchaseLedgerEntry.deleteMany({
            where: { purchaseId: { in: purchaseIds } },
          });
          await tx.purchaseVoucher.deleteMany({
            where: { id: { in: purchaseIds } },
          });
        }

        // --- PAYMENT ---
        if (paymentIds.length > 0) {
          await tx.paymentLedgerEntry.deleteMany({
            where: { paymentId: { in: paymentIds } },
          });
          await tx.paymentVoucher.deleteMany({
            where: { id: { in: paymentIds } },
          });
        }

        // --- RECEIPT ---
        if (receiptIds.length > 0) {
          await tx.receiptLedgerEntry.deleteMany({
            where: { receiptId: { in: receiptIds } },
          });
          await tx.receiptVoucher.deleteMany({
            where: { id: { in: receiptIds } },
          });
        }

        // --- CONTRA ---
        if (contraIds.length > 0) {
          await tx.contraLedgerEntry.deleteMany({
            where: { contraId: { in: contraIds } },
          });
          await tx.contraVoucher.deleteMany({
            where: { id: { in: contraIds } },
          });
        }

        // --- JOURNAL ---
        if (journalIds.length > 0) {
          await tx.journalLedgerEntry.deleteMany({
            where: { journalId: { in: journalIds } },
          });
          await tx.journalVoucher.deleteMany({
            where: { id: { in: journalIds } },
          });
        }

        // --- STOCK JOURNAL ---
        if (stockJournalIds.length > 0) {
          await tx.stockJournalEntry.deleteMany({
            where: { stockJournalId: { in: stockJournalIds } },
          });
          await tx.stockJournal.deleteMany({
            where: { id: { in: stockJournalIds } },
          });
        }
      },
      {
        timeout: 20000, // Increase timeout to 20 seconds (default is 5s)
      }
    );

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      message: `Successfully deleted ${items.length} vouchers.`,
    };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, message: "Database Error: " + error.message };
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

// ✅ NEW: Unified Search for Verification Box
// This checks BOTH standard Vouchers and Stock Journals
export async function getVoucherByTxCode(txCode: string) {
  if (!txCode) return { success: false, message: "Code required" };

  try {
    // 1. Try finding in Standard Vouchers (Sales, Purchase, Journal, etc.)
    const voucher = await prisma.voucher.findUnique({
      where: { transactionCode: txCode },
      include: {
        createdBy: { select: { name: true } },
        entries: { include: { ledger: true } },
      },
    });

    if (voucher) {
      return {
        success: true,
        type: "STANDARD",
        data: voucher,
      };
    }

    // 2. Try finding in Stock Journals (The Missing Part!)
    const stockJournal = await prisma.stockJournal.findUnique({
      where: { transactionCode: txCode },
      include: {
        createdBy: { select: { name: true } },
        inventoryEntries: { include: { stockItem: true } },
      },
    });

    if (stockJournal) {
      return {
        success: true,
        type: "STOCK_JOURNAL", // Tells frontend this is a manufacturing entry
        data: stockJournal,
      };
    }

    return { success: false, message: "Invalid Transaction Code" };
  } catch (error) {
    return { success: false, message: "Database Error" };
  }
}
