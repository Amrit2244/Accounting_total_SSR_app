"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- CREATE UNIT ---
const UnitSchema = z.object({
  name: z.string().min(1), // e.g. Numbers
  symbol: z.string().min(1), // e.g. Nos
  companyId: z.string(),
});

export async function createUnit(prevState: any, formData: FormData) {
  const result = UnitSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: "Invalid Data" };

  try {
    await prisma.unit.create({
      data: {
        name: result.data.name,
        symbol: result.data.symbol,
        companyId: parseInt(result.data.companyId),
      },
    });
    revalidatePath(`/companies/${result.data.companyId}/inventory`);
    return { success: true }; // We might stay on page to add more
  } catch (e) {
    return { error: "Failed to create Unit" };
  }
}

// --- CREATE STOCK ITEM ---
const ItemSchema = z.object({
  name: z.string().min(1),
  unitId: z.string().min(1, "Unit is required"),
  partNumber: z.string().optional(),
  openingQty: z.string().optional(),
  openingRate: z.string().optional(),
  companyId: z.string(),
});

export async function createStockItem(prevState: any, formData: FormData) {
  const result = ItemSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0].message };

  const { name, unitId, partNumber, openingQty, openingRate, companyId } =
    result.data;

  try {
    await prisma.stockItem.create({
      data: {
        name,
        unitId: parseInt(unitId),
        partNumber,
        companyId: parseInt(companyId),
        // If opening stock exists, we should technically create an opening entry,
        // but for now let's just ignore the complex accounting of opening stock
      },
    });
  } catch (e) {
    return { error: "Failed to create Item" };
  }

  redirect(`/companies/${companyId}/inventory`);
}
