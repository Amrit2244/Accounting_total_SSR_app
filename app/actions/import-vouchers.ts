"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DOMParser } from "@xmldom/xmldom";

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

export async function importVouchers(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const voucherNodes = xmlDoc.getElementsByTagName("VOUCHER");

  let count = 0;

  for (let i = 0; i < voucherNodes.length; i++) {
    const v = voucherNodes[i];
    if (v.getAttribute("ACTION") === "Delete") continue;

    const voucherType = v.getAttribute("VCHTYPE") || "Unknown";
    const voucherNumber =
      v.getElementsByTagName("VOUCHERNUMBER")[0]?.textContent || "AUTO";
    const dateStr = v.getElementsByTagName("DATE")[0]?.textContent || "";
    const narration = v.getElementsByTagName("NARRATION")[0]?.textContent || "";

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);

    // --- 1. PROCESS INVENTORY (ITEMS) ---
    const invList = v.getElementsByTagName("ALLINVENTORYENTRIES.LIST");

    // ✅ FIX: Define explicit type for inventory data
    const inventoryData: {
      itemName: string;
      stockItemId: number;
      quantity: number;
      unit: string;
      rate: number;
      amount: number;
    }[] = [];

    let inventoryTotal = 0;

    for (let j = 0; j < invList.length; j++) {
      const itemNode = invList[j];
      const itemName =
        itemNode.getElementsByTagName("STOCKITEMNAME")[0]?.textContent || "";
      const amountStr = itemNode.getElementsByTagName("AMOUNT")[0]?.textContent;

      const quantity = Math.abs(
        parseTallyNumber(
          itemNode.getElementsByTagName("ACTUALQTY")[0]?.textContent
        )
      );
      const rate = Math.abs(
        parseTallyNumber(itemNode.getElementsByTagName("RATE")[0]?.textContent)
      );
      const amount = parseTallyNumber(amountStr);

      inventoryTotal += Math.abs(amount);

      const stockItem = await prisma.stockItem.findFirst({
        where: { name: itemName, companyId },
      });

      // ✅ FIX: Only add if stockItem exists to ensure stockItemId is a number
      if (stockItem) {
        inventoryData.push({
          itemName,
          stockItemId: stockItem.id,
          quantity,
          unit: parseTallyUnit(
            itemNode.getElementsByTagName("ACTUALQTY")[0]?.textContent
          ),
          rate,
          amount,
        });
      }
    }

    // --- 2. PROCESS ACCOUNTING (LEDGERS) ---
    const ledgerList =
      v.getElementsByTagName("LEDGERENTRIES.LIST").length > 0
        ? v.getElementsByTagName("LEDGERENTRIES.LIST")
        : v.getElementsByTagName("ALLLEDGERENTRIES.LIST");

    // ✅ FIX: Define explicit type for ledger data
    const ledgerData: {
      ledgerName: string;
      ledgerId: number;
      amount: number;
    }[] = [];

    let ledgerDebitTotal = 0;

    for (let k = 0; k < ledgerList.length; k++) {
      const lNode = ledgerList[k];
      const ledgerName =
        lNode.getElementsByTagName("LEDGERNAME")[0]?.textContent || "";
      const amountStr =
        lNode.getElementsByTagName("AMOUNT")[0]?.textContent || "0";

      const amount = parseTallyNumber(amountStr);
      if (amount > 0) ledgerDebitTotal += amount;

      const ledger = await prisma.ledger.findFirst({
        where: { name: ledgerName, companyId },
      });

      // ✅ FIX: Only add if ledger exists to ensure ledgerId is a number
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

    try {
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
      count++;
    } catch (error) {
      console.error(`Error with Vch ${voucherNumber}:`, error);
    }
  }

  revalidatePath(`/companies/${companyId}/vouchers`);
  return { success: true, message: `Successfully imported ${count} vouchers.` };
}
