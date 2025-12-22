"use server";

import { prisma } from "@/lib/prisma";

export async function getFullCompanyData(companyId: number) {
  try {
    const data = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        // 1. Masters
        groups: true,
        ledgers: {
          include: {
            // ✅ Include entries from all separate tables
            salesEntries: true,
            purchaseEntries: true,
            paymentEntries: true,
            receiptEntries: true,
            contraEntries: true,
            journalEntries: true,
          },
        },
        units: true,
        stockGroups: true,
        stockItems: true,

        // 2. Vouchers (Fetch all types separately)
        salesVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
            inventoryEntries: { include: { stockItem: true } },
          },
        },
        purchaseVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
            inventoryEntries: { include: { stockItem: true } },
          },
        },
        paymentVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
          },
        },
        receiptVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
          },
        },
        contraVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
          },
        },
        journalVouchers: {
          include: {
            ledgerEntries: { include: { ledger: true } },
          },
        },
        stockJournals: {
          include: {
            inventoryEntries: { include: { stockItem: true } },
          },
        },
      },
    });

    return { success: true, data };
  } catch (error) {
    console.error("Export Fetch Error:", error);
    return { success: false, message: "Failed to fetch company records." };
  }
}
