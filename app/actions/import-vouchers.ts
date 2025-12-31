"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DOMParser } from "@xmldom/xmldom";

// --- HELPERS ---
function parseTallyNumber(str: string | null | undefined): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "");
  const match = clean.match(/-?\d+(\.\d+)?/);

  /**
   * ROOT FIX: Maintain the Tally Sign Convention.
   * Tally exports Dr as Negative and Cr as Positive.
   * We remove the "-" multiplication to store the raw data.
   */
  return match ? parseFloat(match[0]) : 0;
}

function parseTallyUnit(str: string | null | undefined): string {
  if (!str) return "";
  const match = str.match(/[a-zA-Z]+/);
  return match ? match[0] : "";
}

function generateTransactionCode(prefix: string) {
  return (
    prefix + "-" + Math.random().toString(36).substring(2, 9).toUpperCase()
  );
}

// --- OPTIMIZED IMPORT FUNCTION ---
export async function importVouchers(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const voucherNodes = Array.from(xmlDoc.getElementsByTagName("VOUCHER"));

  console.log(`📂 Parsing ${voucherNodes.length} vouchers...`);

  let successCount = 0;
  let errorCount = 0;

  const BATCH_SIZE = 10;

  for (let i = 0; i < voucherNodes.length; i += BATCH_SIZE) {
    const batch = voucherNodes.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (v) => {
        try {
          if (v.getAttribute("ACTION") === "Delete") return;

          const rawVoucherType = v.getAttribute("VCHTYPE") || "Unknown";
          const voucherType = rawVoucherType.toLowerCase();

          const voucherNumber =
            v.getElementsByTagName("VOUCHERNUMBER")[0]?.textContent || "AUTO";
          const dateStr = v.getElementsByTagName("DATE")[0]?.textContent || "";
          const narration =
            v.getElementsByTagName("NARRATION")[0]?.textContent || "";

          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          if (!year || !month || !day) return;
          const date = new Date(`${year}-${month}-${day}`);

          // --- 1. PARSE INVENTORY ENTRIES ---
          const invList = v.getElementsByTagName("ALLINVENTORYENTRIES.LIST");
          const inventoryData = [];
          let inventoryTotal = 0;

          for (let j = 0; j < invList.length; j++) {
            const itemNode = invList[j];
            const itemName =
              itemNode.getElementsByTagName("STOCKITEMNAME")[0]?.textContent ||
              "";

            // Raw Tally Amount (Negative for Sales/Dr, Positive for Purchase/Cr)
            const rawAmount = parseTallyNumber(
              itemNode.getElementsByTagName("AMOUNT")[0]?.textContent
            );

            inventoryTotal += Math.abs(rawAmount);

            const stockItem = await prisma.stockItem.findFirst({
              where: { name: itemName, companyId },
              select: { id: true },
            });

            if (stockItem) {
              inventoryData.push({
                stockItemId: stockItem.id,
                quantity: Math.abs(
                  parseTallyNumber(
                    itemNode.getElementsByTagName("ACTUALQTY")[0]?.textContent
                  )
                ),
                unit: parseTallyUnit(
                  itemNode.getElementsByTagName("ACTUALQTY")[0]?.textContent
                ),
                rate: Math.abs(
                  parseTallyNumber(
                    itemNode.getElementsByTagName("RATE")[0]?.textContent
                  )
                ),
                amount: rawAmount, // Keep original sign
              });
            }
          }

          // --- 2. PARSE LEDGER ENTRIES ---
          const ledgerList =
            v.getElementsByTagName("LEDGERENTRIES.LIST").length > 0
              ? v.getElementsByTagName("LEDGERENTRIES.LIST")
              : v.getElementsByTagName("ALLLEDGERENTRIES.LIST");

          const ledgerData = [];
          let ledgerDebitTotal = 0;

          for (let k = 0; k < ledgerList.length; k++) {
            const lNode = ledgerList[k];
            const ledgerName =
              lNode.getElementsByTagName("LEDGERNAME")[0]?.textContent || "";

            // Raw Tally Amount
            const amount = parseTallyNumber(
              lNode.getElementsByTagName("AMOUNT")[0]?.textContent
            );

            // In Tally Dr is negative. For totalAmount we take absolute Dr side.
            if (amount < 0) ledgerDebitTotal += Math.abs(amount);

            const ledger = await prisma.ledger.findFirst({
              where: { name: ledgerName, companyId },
              select: { id: true },
            });

            if (ledger) {
              ledgerData.push({
                ledgerId: ledger.id,
                amount: amount, // Keep original sign
              });
            }
          }

          const finalTotalAmount =
            inventoryTotal > 0 ? inventoryTotal : ledgerDebitTotal;

          const commonData = {
            date,
            narration,
            totalAmount: Math.abs(finalTotalAmount),
            status: "APPROVED",
          };

          const uniqueKey = {
            companyId_voucherNo: {
              companyId,
              voucherNo: String(voucherNumber),
            },
          };

          if (voucherType.includes("sales")) {
            await prisma.salesVoucher.upsert({
              where: uniqueKey,
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
                inventoryEntries: { deleteMany: {}, create: inventoryData },
              },
              create: {
                companyId,
                voucherNo: String(voucherNumber),
                transactionCode: generateTransactionCode("SLS"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
                inventoryEntries: { create: inventoryData },
              },
            });
          } else if (voucherType.includes("purchase")) {
            await prisma.purchaseVoucher.upsert({
              where: uniqueKey,
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
                inventoryEntries: { deleteMany: {}, create: inventoryData },
              },
              create: {
                companyId,
                voucherNo: String(voucherNumber),
                transactionCode: generateTransactionCode("PUR"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
                inventoryEntries: { create: inventoryData },
              },
            });
          } else if (voucherType.includes("payment")) {
            const vNoInt =
              parseInt(String(voucherNumber).replace(/\D/g, "")) || 0;
            await prisma.paymentVoucher.upsert({
              where: { companyId_voucherNo: { companyId, voucherNo: vNoInt } },
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
              },
              create: {
                companyId,
                voucherNo: vNoInt,
                transactionCode: generateTransactionCode("PAY"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
              },
            });
          } else if (voucherType.includes("receipt")) {
            const vNoInt =
              parseInt(String(voucherNumber).replace(/\D/g, "")) || 0;
            await prisma.receiptVoucher.upsert({
              where: { companyId_voucherNo: { companyId, voucherNo: vNoInt } },
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
              },
              create: {
                companyId,
                voucherNo: vNoInt,
                transactionCode: generateTransactionCode("RCT"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
              },
            });
          } else if (voucherType.includes("contra")) {
            const vNoInt =
              parseInt(String(voucherNumber).replace(/\D/g, "")) || 0;
            await prisma.contraVoucher.upsert({
              where: { companyId_voucherNo: { companyId, voucherNo: vNoInt } },
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
              },
              create: {
                companyId,
                voucherNo: vNoInt,
                transactionCode: generateTransactionCode("CNTR"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
              },
            });
          } else if (
            voucherType.includes("journal") &&
            !voucherType.includes("stock")
          ) {
            const vNoInt =
              parseInt(String(voucherNumber).replace(/\D/g, "")) || 0;
            await prisma.journalVoucher.upsert({
              where: { companyId_voucherNo: { companyId, voucherNo: vNoInt } },
              update: {
                ...commonData,
                ledgerEntries: { deleteMany: {}, create: ledgerData },
              },
              create: {
                companyId,
                voucherNo: vNoInt,
                transactionCode: generateTransactionCode("JRNL"),
                ...commonData,
                createdById: userId,
                ledgerEntries: { create: ledgerData },
              },
            });
          }

          successCount++;
        } catch (err) {
          console.error(`Skipping Voucher:`, err);
          errorCount++;
        }
      })
    );
  }

  console.log(`✅ Completed: ${successCount} Imported, ${errorCount} Failed`);
  revalidatePath(`/companies/${companyId}/vouchers`);
  return {
    success: true,
    message: `Imported ${successCount} vouchers. (${errorCount} skipped)`,
  };
}
