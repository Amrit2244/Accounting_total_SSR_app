"use server";

import { prisma } from "@/lib/prisma";

/**
 * Fetches all company-related data for a full JSON export/backup.
 * Returns a standardized response object for the client.
 */
export async function getFullCompanyData(companyId: number) {
  try {
    const [
      company,
      groups,
      ledgers,
      stockGroups,
      units,
      stockItems,
      sales,
      purchases,
      payments,
      receipts,
      contras,
      journals,
      stockJournals,
    ] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.group.findMany({ where: { companyId } }),
      prisma.ledger.findMany({
        where: { companyId },
        include: { group: true }, // Included to get group names for Tally XML
      }),
      prisma.stockGroup.findMany({ where: { companyId } }),
      prisma.unit.findMany({ where: { companyId } }),
      prisma.stockItem.findMany({ where: { companyId } }),
      prisma.salesVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true, inventoryEntries: true },
      }),
      prisma.purchaseVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true, inventoryEntries: true },
      }),
      prisma.paymentVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true },
      }),
      prisma.receiptVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true },
      }),
      prisma.contraVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true },
      }),
      prisma.journalVoucher.findMany({
        where: { companyId },
        include: { ledgerEntries: true },
      }),
      prisma.stockJournal.findMany({
        where: { companyId },
        include: { inventoryEntries: true },
      }),
    ]);

    if (!company) {
      return { success: false, error: "Company not found" };
    }

    return {
      success: true,
      data: {
        company,
        groups,
        ledgers,
        stockGroups,
        units,
        stockItems,
        vouchers: {
          sales,
          purchases,
          payments,
          receipts,
          contras,
          journals,
          stockJournals,
        },
        exportTimestamp: new Date().toISOString(),
        metadata: {
          app: "Accounting SSR",
          version: "1.0.0",
        },
      },
    };
  } catch (error) {
    console.error("Export Error:", error);
    return {
      success: false,
      error: "Failed to collect company data for export.",
    };
  }
}
