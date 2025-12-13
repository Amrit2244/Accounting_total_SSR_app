"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createLedger(formData: FormData) {
  const companyId = parseInt(formData.get("companyId") as string);
  const name = formData.get("name") as string;
  const groupId = parseInt(formData.get("groupId") as string);

  // Handling Opening Balance
  const rawBalance = parseFloat(formData.get("openingBalance") as string) || 0;
  const balanceType = formData.get("balanceType") as string;

  // In our system:
  // Debit (Assets/Expenses) is POSITIVE (+)
  // Credit (Liabilities/Income) is NEGATIVE (-)
  let finalOpeningBalance = rawBalance;
  if (balanceType === "Cr") {
    finalOpeningBalance = -Math.abs(rawBalance);
  } else {
    finalOpeningBalance = Math.abs(rawBalance);
  }

  if (!name || !groupId) {
    return; // Add error handling if needed
  }

  try {
    await prisma.ledger.create({
      data: {
        name,
        groupId,
        companyId,
        openingBalance: finalOpeningBalance,
      },
    });
  } catch (e) {
    console.error("Error creating ledger", e);
    return { error: "Failed to create ledger" };
  }

  revalidatePath(`/companies/${companyId}/chart-of-accounts`);
  redirect(`/companies/${companyId}/chart-of-accounts`);
}
