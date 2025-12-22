"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- CREATE LEDGER ---
export async function createLedger(formData: FormData) {
  const companyId = parseInt(formData.get("companyId") as string);
  const name = formData.get("name") as string;
  const groupId = parseInt(formData.get("groupId") as string);
  const rawBalance = parseFloat(formData.get("openingBalance") as string) || 0;
  const balanceType = formData.get("balanceType") as string;

  let finalOpeningBalance =
    balanceType === "Cr" ? -Math.abs(rawBalance) : Math.abs(rawBalance);

  if (!name || !groupId) return { error: "Missing required fields" };

  try {
    await prisma.ledger.create({
      data: { name, groupId, companyId, openingBalance: finalOpeningBalance },
    });
  } catch (e) {
    console.error("Error creating ledger", e);
    return { error: "Failed to create ledger" };
  }

  revalidatePath(`/companies/${companyId}/chart-of-accounts`);
  redirect(`/companies/${companyId}/chart-of-accounts`);
}

// --- UPDATE BANK DATE (Fixed for split schema) ---
export async function updateBankDate(
  entryId: number,
  type: string,
  date: string | null
) {
  try {
    const d = date ? new Date(date) : null;

    // Check type to know which table to update
    // Note: Ensure your schema has 'bankDate' on these models
    if (type === "PAYMENT") {
      await prisma.paymentLedgerEntry.update({
        where: { id: entryId },
        data: { bankDate: d },
      }); // Add bankDate to schema if missing
    } else if (type === "RECEIPT") {
      await prisma.receiptLedgerEntry.update({
        where: { id: entryId },
        data: { bankDate: d },
      });
    } else if (type === "CONTRA") {
      await prisma.contraLedgerEntry.update({
        where: { id: entryId },
        data: { bankDate: d },
      });
    } else {
      return {
        error:
          "Bank dates are only applicable for Payment, Receipt, or Contra.",
      };
    }

    return { success: true };
  } catch (e) {
    return { error: "Failed to update bank date" };
  }
}
