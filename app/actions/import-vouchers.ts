"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DOMParser } from "@xmldom/xmldom";

// --- HELPERS ---

function parseTallyNumber(str: string | null | undefined): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "");
  const match = clean.match(/-?\d+(\.\d+)?/);
  return match ? Math.abs(parseFloat(match[0])) : 0;
}

function parseTallyUnit(str: string | null | undefined): string {
  if (!str) return "";
  const match = str.match(/[a-zA-Z]+/);
  return match ? match[0] : "";
}

// Generate IMP-XXXXXX code to prevent duplicates
function generateTransactionCode() {
  return "IMP-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// --- MAIN IMPORT FUNCTION ---

export async function importVouchers(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  // CHECK YOUR TERMINAL FOR THIS MESSAGE
  console.log("🔥 LATEST CODE LOADED 🔥 - Starting Import...");

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const voucherNodes = xmlDoc.getElementsByTagName("VOUCHER");

  let count = 0;

  for (let i = 0; i < voucherNodes.length; i++) {
    const v = voucherNodes[i];

    // 1. Skip Deletions
    const action = v.getAttribute("ACTION");
    if (action === "Delete") continue;

    // 2. Extract Basic Fields
    const voucherType = v.getAttribute("VCHTYPE") || "Unknown";
    const voucherNumber =
      v.getElementsByTagName("VOUCHERNUMBER")[0]?.textContent || "";
    const reference =
      v.getElementsByTagName("REFERENCE")[0]?.textContent || null;
    const dateStr = v.getElementsByTagName("DATE")[0]?.textContent || "";
    const narration = v.getElementsByTagName("NARRATION")[0]?.textContent || "";
    const partyName =
      v.getElementsByTagName("PARTYLEDGERNAME")[0]?.textContent || "";

    // Parse Date
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);

    // 3. Process Inventory (Items)
    const inventoryList = v.getElementsByTagName("ALLINVENTORYENTRIES.LIST");
    const inventoryData = [];
    let inventoryTotal = 0;

    for (let j = 0; j < inventoryList.length; j++) {
      const itemNode = inventoryList[j];
      const itemName =
        itemNode.getElementsByTagName("STOCKITEMNAME")[0]?.textContent || "";
      const qtyStr = itemNode.getElementsByTagName("ACTUALQTY")[0]?.textContent;
      const rateStr = itemNode.getElementsByTagName("RATE")[0]?.textContent;
      const amountStr = itemNode.getElementsByTagName("AMOUNT")[0]?.textContent;

      const quantity = parseTallyNumber(qtyStr);
      const unit = parseTallyUnit(qtyStr);
      const rate = parseTallyNumber(rateStr);
      const amount = parseTallyNumber(amountStr);

      inventoryTotal += amount;

      const stockItem = await prisma.stockItem.findFirst({
        where: { name: itemName, companyId },
      });

      inventoryData.push({
        itemName,
        stockItemId: stockItem?.id,
        quantity,
        unit,
        rate,
        amount,
      });
    }

    // 4. Process Accounting (Ledgers)
    const ledgerList = v.getElementsByTagName("LEDGERENTRIES.LIST");
    const ledgerData = [];
    let ledgerDebitTotal = 0;

    for (let k = 0; k < ledgerList.length; k++) {
      const lNode = ledgerList[k];
      const ledgerName =
        lNode.getElementsByTagName("LEDGERNAME")[0]?.textContent || "";
      const amountStr =
        lNode.getElementsByTagName("AMOUNT")[0]?.textContent || "0";
      const isDeemedPositive =
        lNode.getElementsByTagName("ISDEEMEDPOSITIVE")[0]?.textContent;

      let amount = parseFloat(amountStr.replace(/,/g, ""));

      // Calculate Debits for fallback total
      if (isDeemedPositive === "Yes") {
        amount = Math.abs(amount);
        ledgerDebitTotal += amount;
      } else {
        amount = -Math.abs(amount);
      }

      const ledger = await prisma.ledger.findFirst({
        where: { name: ledgerName, companyId },
      });

      ledgerData.push({
        ledgerName,
        ledgerId: ledger?.id,
        amount,
      });
    }

    // 5. CALCULATE TOTAL (CRITICAL FIX)
    // If inventory exists, use it. If not (Payment/Receipt), use Ledger Debits.
    let finalTotalAmount =
      inventoryTotal > 0 ? inventoryTotal : ledgerDebitTotal;

    // Safety check to ensure we never send NaN or undefined
    if (isNaN(finalTotalAmount) || !finalTotalAmount) {
      finalTotalAmount = 0.0;
    }

    // 6. Database Save
    try {
      await prisma.voucher.upsert({
        where: {
          companyId_voucherNo_type: {
            companyId,
            voucherNo: voucherNumber,
            type: voucherType,
          },
        },
        update: {
          date,
          reference,
          partyName,
          narration,
          totalAmount: finalTotalAmount, // <--- EXPLICITLY PROVIDED
          entries: { deleteMany: {}, create: ledgerData },
          inventory: { deleteMany: {}, create: inventoryData },
        },
        create: {
          companyId,
          voucherNo: voucherNumber,
          type: voucherType,
          transactionCode: generateTransactionCode(), // <--- NEW IMP CODE
          date,
          reference,
          partyName,
          narration,
          totalAmount: finalTotalAmount, // <--- EXPLICITLY PROVIDED
          status: "APPROVED",
          createdById: userId,
          entries: { create: ledgerData },
          inventory: { create: inventoryData },
        },
      });
      count++;
    } catch (error) {
      console.error(`Skipping ${voucherNumber}:`, error);
    }
  }

  revalidatePath(`/companies/${companyId}/vouchers`);
  return { success: true, message: `Imported ${count} vouchers successfully` };
}
