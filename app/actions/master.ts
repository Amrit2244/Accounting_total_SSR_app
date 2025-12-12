"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const LedgerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  groupId: z.string().min(1, "Parent Group is required"),
  openingBalance: z.string().optional(),
  openingType: z.enum(["Dr", "Cr"]).optional(), // Dr or Cr
  companyId: z.string(),
});

export async function createLedger(prevState: any, formData: FormData) {
  const result = LedgerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, groupId, openingBalance, openingType, companyId } = result.data;

  // Convert Balance Logic:
  // If user selects 'Cr', store as negative. If 'Dr', store as positive.
  let balance = parseFloat(openingBalance || "0");
  if (openingType === "Cr") {
    balance = -Math.abs(balance);
  } else {
    balance = Math.abs(balance);
  }

  try {
    // Check for duplicate name in this company
    const existing = await prisma.ledger.findFirst({
      where: { name, companyId: parseInt(companyId) },
    });

    if (existing)
      return { error: "Ledger name already exists in this company." };

    await prisma.ledger.create({
      data: {
        name,
        groupId: parseInt(groupId),
        companyId: parseInt(companyId),
        openingBalance: balance,
      },
    });
  } catch (e) {
    return { error: "Failed to create ledger." };
  }

  // Redirect back to the Chart of Accounts so they can see it immediately
  const path = `/companies/${companyId}/chart-of-accounts`;
  revalidatePath(path);
  redirect(path);
}
