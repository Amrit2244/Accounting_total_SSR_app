"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DOMParser } from "@xmldom/xmldom";

// --- HELPERS (Keep these as they are) ---
function parseTallyNumber(str: string | null | undefined): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "");
  const match = clean.match(/-?\d+(\.\d+)?/);
  return match ? -parseFloat(match[0]) : 0;
}

function parseTallyUnit(str: string | null | undefined): string {
  if (!str) return "";
  const match = str.match(/[a-zA-Z]+/);
  return match ? match[0] : "";
}

function generateTransactionCode() {
  return "IMP-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// --- OPTIMIZED IMPORT FUNCTION ---
export async function importVouchers(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const voucherNodes = Array.from(xmlDoc.getElementsByTagName("VOUCHER")); // Convert to Array for chunking

  console.log(`📂 Parsing ${voucherNodes.length} vouchers...`);

  let successCount = 0;
  let errorCount = 0;

  // ✅ OPTIMIZATION: Process in batches of 20 to prevent DB connection timeout
  const BATCH_SIZE = 20;

  for (let i = 0; i < voucherNodes.length; i += BATCH_SIZE) {
    const batch = voucherNodes.slice(i, i + BATCH_SIZE);

    // Process this batch in parallel
    await Promise.all(
      batch.map(async (v) => {
        try {
          if (v.getAttribute("ACTION") === "Delete") return;

          const voucherType = v.getAttribute("VCHTYPE") || "Unknown";
          const voucherNumber =
            v.getElementsByTagName("VOUCHERNUMBER")[0]?.textContent || "AUTO";
          const dateStr = v.getElementsByTagName("DATE")[0]?.textContent || "";
          const narration =
            v.getElementsByTagName("NARRATION")[0]?.textContent || "";

          // Date Parsing
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          // Safety check for invalid dates
          if (!year || !month || !day) return;
          const date = new Date(`${year}-${month}-${day}`);

          // --- 1. INVENTORY ---
          const invList = v.getElementsByTagName("ALLINVENTORYENTRIES.LIST");
          const inventoryData = [];
          let inventoryTotal = 0;

          for (let j = 0; j < invList.length; j++) {
            const itemNode = invList[j];
            const itemName =
              itemNode.getElementsByTagName("STOCKITEMNAME")[0]?.textContent ||
              "";
            const amount = parseTallyNumber(
              itemNode.getElementsByTagName("AMOUNT")[0]?.textContent
            );

            inventoryTotal += Math.abs(amount);

            // Fetch Item ID (Ideally cache this, but findFirst is okay for now)
            const stockItem = await prisma.stockItem.findFirst({
              where: { name: itemName, companyId },
              select: { id: true }, // Select only ID for speed
            });

            if (stockItem) {
              inventoryData.push({
                itemName,
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
                amount,
              });
            }
          }

          // --- 2. LEDGERS ---
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
            const amount = parseTallyNumber(
              lNode.getElementsByTagName("AMOUNT")[0]?.textContent
            );

            if (amount > 0) ledgerDebitTotal += amount;

            const ledger = await prisma.ledger.findFirst({
              where: { name: ledgerName, companyId },
              select: { id: true }, // Select only ID for speed
            });

            if (ledger) {
              ledgerData.push({
                ledgerName,
                ledgerId: ledger.id,
                amount,
              });
            }
          }

          const finalTotalAmount =
            inventoryTotal > 0 ? inventoryTotal : ledgerDebitTotal;

          // Database Write
          await prisma.voucher.upsert({
            where: {
              companyId_voucherNo_type: {
                companyId,
                voucherNo: String(voucherNumber),
                type: String(voucherType),
              },
            },
            update: {
              date,
              narration,
              totalAmount: Math.abs(finalTotalAmount),
              entries: { deleteMany: {}, create: ledgerData },
              inventory: { deleteMany: {}, create: inventoryData },
            },
            create: {
              companyId,
              voucherNo: String(voucherNumber),
              type: String(voucherType) as any,
              transactionCode: generateTransactionCode(),
              date,
              narration,
              totalAmount: Math.abs(finalTotalAmount),
              status: "APPROVED",
              createdById: userId,
              entries: { create: ledgerData },
              inventory: { create: inventoryData },
            },
          });

          successCount++;
        } catch (err) {
          console.error(`Skipping Voucher:`, err);
          errorCount++;
        }
      })
    ); // End Promise.all
  } // End Loop

  console.log(`✅ Completed: ${successCount} Imported, ${errorCount} Failed`);
  revalidatePath(`/companies/${companyId}/vouchers`);
  return {
    success: true,
    message: `Imported ${successCount} vouchers. (${errorCount} skipped)`,
  };
}
