"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

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
  openingRate: z.coerce.number().default(0),
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
  type: z.string().min(1),
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
    await prisma.stockGroup.create({
      data: {
        name: validatedFields.data.name,
        companyId: validatedFields.data.companyId,
        parentId: validatedFields.data.parentId,
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

  const { openingRate, ...itemData } = validatedFields.data;

  try {
    await prisma.stockItem.create({
      data: {
        name: itemData.name,
        groupId: itemData.groupId,
        unitId: itemData.unitId,
        companyId: itemData.companyId,
        partNumber: itemData.partNumber,
        minStock: itemData.minStock,
        gstRate: itemData.gstRate,
        openingQty: itemData.openingQty,
        quantity: itemData.openingQty,
        openingValue: itemData.openingQty * openingRate,
      },
    });

    revalidatePath(`/companies/${itemData.companyId}/inventory`);
    return { success: true, message: "Item created successfully" };
  } catch (error: any) {
    console.error("Stock Item Create Error:", error);
    return { message: "Database Error: " + error.message, success: false };
  }
}

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

    const status = "PENDING";

    const entries: any[] = [];

    consumption.forEach((i: any) =>
      entries.push({
        stockItemId: parseInt(i.sid),
        quantity: -Math.abs(parseFloat(i.qty)),
        rate: parseFloat(i.rate),
        amount: parseFloat(i.qty) * parseFloat(i.rate),
        isProduction: false,
      })
    );

    production.forEach((i: any) =>
      entries.push({
        stockItemId: parseInt(i.sid),
        quantity: Math.abs(parseFloat(i.qty)),
        rate: parseFloat(i.rate),
        amount: parseFloat(i.qty) * parseFloat(i.rate),
        isProduction: true,
      })
    );

    const randomCode = Math.floor(10000 + Math.random() * 90000).toString();

    await prisma.stockJournal.create({
      data: {
        companyId,
        date,
        voucherNo: "SJ-" + randomCode,
        transactionCode: randomCode,
        narration,
        status: status,
        createdById: userId,
        verifiedById: null,
        inventoryEntries: { create: entries },
      },
    });

    revalidatePath(`/companies/${companyId}/inventory`);

    return {
      success: true,
      message: `Stock Journal Posted. TX Code: ${randomCode}`,
    };
  } catch (error: any) {
    console.error("Stock Journal Error:", error);
    return { error: "Failed: " + error.message };
  }
}

export async function verifyStockJournal(
  voucherId: number,
  isApproved: boolean
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    const status = isApproved ? "APPROVED" : "REJECTED";

    const journal = await prisma.stockJournal.update({
      where: { id: voucherId },
      data: {
        status: status,
        verifiedById: userId,
      },
      include: { inventoryEntries: true },
    });

    if (isApproved) {
      // ✅ FIXED: Using 'tx: any' to bypass Prisma namespace export issues on server build
      await prisma.$transaction(async (tx: any) => {
        for (const entry of journal.inventoryEntries) {
          await tx.stockItem.update({
            where: { id: entry.stockItemId },
            data: {
              quantity: { increment: entry.quantity },
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
    type,
    date,
    narration,
    structuredEntries,
    structuredInventory,
  } = validatedFields.data;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId)
      return { success: false, message: "Unauthorized. Session expired." };

    const newTxCode = Math.floor(10000 + Math.random() * 90000).toString();
    const totalAmount = (structuredEntries as any[]).reduce(
      (sum: number, e: any) => sum + (e.amount > 0 ? e.amount : 0),
      0
    );

    const updateData = {
      date: new Date(date),
      narration,
      status: "PENDING",
      transactionCode: newTxCode,
      updatedAt: new Date(),
      createdById: currentUserId,
      verifiedById: null,
      totalAmount,
    };

    const ledgerEntriesCreate = (structuredEntries as any[]).map((e: any) => ({
      ledgerId: Number(e.ledgerId),
      amount: Number(e.amount),
    }));

    // ✅ FIXED: Using 'tx: any' here as well
    await prisma.$transaction(async (tx: any) => {
      if (type === "SALES") {
        await tx.salesVoucher.update({
          where: { id: voucherId },
          data: {
            ...updateData,
            ledgerEntries: { deleteMany: {}, create: ledgerEntriesCreate },
            inventoryEntries: {
              deleteMany: {},
              create: (structuredInventory as any[]).map((i: any) => ({
                stockItemId: Number(i.stockItemId),
                quantity: Number(i.quantity),
                rate: Number(i.rate),
                amount: Number(i.quantity) * Number(i.rate),
              })),
            },
          },
        });
      } else if (type === "PURCHASE") {
        await tx.purchaseVoucher.update({
          where: { id: voucherId },
          data: {
            ...updateData,
            ledgerEntries: { deleteMany: {}, create: ledgerEntriesCreate },
            inventoryEntries: {
              deleteMany: {},
              create: (structuredInventory as any[]).map((i: any) => ({
                stockItemId: Number(i.stockItemId),
                quantity: Number(i.quantity),
                rate: Number(i.rate),
                amount: Number(i.quantity) * Number(i.rate),
              })),
            },
          },
        });
      } else if (type === "PAYMENT") {
        await tx.paymentVoucher.update({
          where: { id: voucherId },
          data: {
            ...updateData,
            ledgerEntries: { deleteMany: {}, create: ledgerEntriesCreate },
          },
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
        openingValue: data.openingQty * data.openingRate,
      },
    });
  } catch (error: any) {
    console.error("Update Error:", error);
    return { message: "Database Error: " + error.message, success: false };
  }

  revalidatePath(`/companies/${data.companyId}/inventory`);
  redirect(`/companies/${data.companyId}/inventory`);
}

// ==========================================
// 4. Delete & Bulk Actions
// ==========================================

export async function deleteBulkLedgers(
  ledgerIds: number[],
  companyId: number
) {
  if (!ledgerIds || ledgerIds.length === 0) {
    return { success: false, message: "No items selected" };
  }

  try {
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

export async function deleteBulkVouchers(
  items: { id: number; type: string }[],
  companyId: number
) {
  if (!items || items.length === 0) return { error: "No items selected" };

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
    // ✅ FIXED: Typed 'tx' as any
    await prisma.$transaction(
      async (tx: any) => {
        if (salesIds.length > 0) {
          await tx.salesItemEntry.deleteMany({
            where: { salesId: { in: salesIds } },
          });
          await tx.salesLedgerEntry.deleteMany({
            where: { salesId: { in: salesIds } },
          });
          await tx.salesVoucher.deleteMany({ where: { id: { in: salesIds } } });
        }
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
        if (paymentIds.length > 0) {
          await tx.paymentLedgerEntry.deleteMany({
            where: { paymentId: { in: paymentIds } },
          });
          await tx.paymentVoucher.deleteMany({
            where: { id: { in: paymentIds } },
          });
        }
        if (receiptIds.length > 0) {
          await tx.receiptLedgerEntry.deleteMany({
            where: { receiptId: { in: receiptIds } },
          });
          await tx.receiptVoucher.deleteMany({
            where: { id: { in: receiptIds } },
          });
        }
        if (contraIds.length > 0) {
          await tx.contraLedgerEntry.deleteMany({
            where: { contraId: { in: contraIds } },
          });
          await tx.contraVoucher.deleteMany({
            where: { id: { in: contraIds } },
          });
        }
        if (journalIds.length > 0) {
          await tx.journalLedgerEntry.deleteMany({
            where: { journalId: { in: journalIds } },
          });
          await tx.journalVoucher.deleteMany({
            where: { id: { in: journalIds } },
          });
        }
        if (stockJournalIds.length > 0) {
          await tx.stockJournalEntry.deleteMany({
            where: { stockJournalId: { in: stockJournalIds } },
          });
          await tx.stockJournal.deleteMany({
            where: { id: { in: stockJournalIds } },
          });
        }
      },
      { timeout: 20000 }
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

export async function getVoucherByTxCode(txCode: string) {
  if (!txCode) return { success: false, message: "Code required" };

  try {
    const [sales, purchase, payment, receipt, contra, journal, stock] =
      await Promise.all([
        prisma.salesVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.purchaseVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.paymentVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.receiptVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.contraVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.journalVoucher.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            ledgerEntries: { include: { ledger: true } },
          },
        }),
        prisma.stockJournal.findUnique({
          where: { transactionCode: txCode },
          include: {
            createdBy: { select: { name: true } },
            inventoryEntries: { include: { stockItem: true } },
          },
        }),
      ]);

    const result = sales || purchase || payment || receipt || contra || journal;

    if (result) {
      return {
        success: true,
        type: "STANDARD",
        data: { ...result, entries: (result as any).ledgerEntries },
      };
    }

    if (stock) {
      return {
        success: true,
        type: "STOCK_JOURNAL",
        data: stock,
      };
    }

    return { success: false, message: "Invalid Transaction Code" };
  } catch (error) {
    return { success: false, message: "Database Error" };
  }
}
