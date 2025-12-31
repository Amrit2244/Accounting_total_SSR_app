"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DOMParser } from "@xmldom/xmldom";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- HELPERS ---
function getNodeVal(parent: any, tagName: string): string {
  if (!parent || typeof parent.getElementsByTagName !== "function") return "";
  const list = parent.getElementsByTagName(tagName);
  if (list && list.length > 0) return list[0].textContent || "";
  return "";
}

function parseNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, "")) || 0;
}

function parseRate(val: string): number {
  if (!val) return 0;
  const clean = val.split("/")[0].replace(/[^0-9.]/g, "");
  return parseFloat(clean) || 0;
}

// Generate 5-Digit ID
function generateRandomID(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Ensure Uniqueness (Recursive check)
async function getUniqueTXID(): Promise<string> {
  let isUnique = false;
  let txCode = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    txCode = generateRandomID();
    // Check if this specific code exists in either table
    const existsSales = await prisma.salesVoucher.findUnique({
      where: { transactionCode: txCode },
    });
    const existsPurchase = await prisma.purchaseVoucher.findUnique({
      where: { transactionCode: txCode },
    });

    if (!existsSales && !existsPurchase) {
      isUnique = true;
    }
    attempts++;
  }

  // Fallback to timestamp if 5-digit space is full or unlucky
  if (!isUnique) return Date.now().toString().slice(-6);
  return txCode;
}

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch {
    return null;
  }
}

function cleanXML(xml: string): string {
  return xml
    .replace(/<\?xml.*?\?>/g, "")
    .replace(/<!DOCTYPE.*?>/g, "")
    .replace(/&#[0-9]+;/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<([a-zA-Z0-9_]+):([a-zA-Z0-9_\.]+)/g, "<$1_$2")
    .replace(/<\/([a-zA-Z0-9_]+):([a-zA-Z0-9_\.]+)/g, "</$1_$2")
    .replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, "&amp;");
}

// --- ENTRY POINT ---
export async function processTallyXML(
  xmlData: string,
  companyId: number,
  userId: number
) {
  try {
    const cleanData = cleanXML(xmlData);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanData, "text/xml");

    const parserErrors = doc.getElementsByTagName("parsererror");
    if (parserErrors.length > 0)
      return { success: false, error: "XML Parser Error" };

    const vouchers = Array.from(doc.getElementsByTagName("VOUCHER"));
    if (vouchers.length === 0)
      return { success: false, error: "No vouchers found" };

    let successCount = 0;
    let errors: string[] = [];

    for (const v of vouchers) {
      try {
        await processSingleVoucher(v as Element, companyId, userId);
        successCount++;
      } catch (err: any) {
        const vNum = getNodeVal(v as Element, "VOUCHERNUMBER");
        console.error(`Voucher #${vNum} Error:`, err.message);
        errors.push(`Voucher #${vNum}: ${err.message}`);
      }
    }

    revalidatePath(`/companies/${companyId}/vouchers`);

    if (errors.length > 0) {
      return {
        success: true,
        message: `Imported ${successCount} vouchers. Errors in: ${errors
          .slice(0, 3)
          .join(", ")}`,
      };
    }
    return {
      success: true,
      message: `Successfully imported ${successCount} vouchers.`,
    };
  } catch (error: any) {
    return { success: false, error: `Critical Error: ${error.message}` };
  }
}

// --- SINGLE VOUCHER LOGIC ---
async function processSingleVoucher(
  v: Element,
  companyId: number,
  userId: number
) {
  const vTypeName = (
    v.getAttribute("VCHTYPE") || getNodeVal(v, "VOUCHERTYPENAME")
  ).toUpperCase();
  const vNum = getNodeVal(v, "VOUCHERNUMBER");

  if (!vTypeName.includes("SALES") && !vTypeName.includes("PURCHASE")) return;

  const vDateStr = getNodeVal(v, "DATE");
  const vDate = new Date(
    `${vDateStr.substring(0, 4)}-${vDateStr.substring(
      4,
      6
    )}-${vDateStr.substring(6, 8)}`
  );
  const narration = getNodeVal(v, "NARRATION");

  // 1. COLLECT NODES
  const allLedgerNodes: Element[] = [];
  const allInventoryNodes: Element[] = [];

  const collect = (tagName: string, target: Element[]) => {
    const lists = v.getElementsByTagName(tagName);
    for (let i = 0; i < lists.length; i++) target.push(lists[i]);
  };

  collect("LEDGERENTRIES.LIST", allLedgerNodes);
  collect("ALLLEDGERENTRIES.LIST", allLedgerNodes);
  collect("INVENTORYENTRIES.LIST", allInventoryNodes);
  collect("ALLINVENTORYENTRIES.LIST", allInventoryNodes);

  for (const inv of allInventoryNodes) {
    const accLists = inv.getElementsByTagName("ACCOUNTINGALLOCATIONS.LIST");
    for (let i = 0; i < accLists.length; i++) allLedgerNodes.push(accLists[i]);
  }
  for (const led of allLedgerNodes) {
    const invLists = led.getElementsByTagName("INVENTORYALLOCATIONS.LIST");
    for (let i = 0; i < invLists.length; i++)
      allInventoryNodes.push(invLists[i]);
  }

  // 2. PREPARE DATA
  const ledgersToCreate: any[] = [];
  const inventoryToCreate: any[] = [];
  const processedLedgers = new Set();
  let calculatedTotal = 0;

  for (const l of allLedgerNodes) {
    const lName = (getNodeVal(l, "LEDGERNAME") || getNodeVal(l, "NAME"))
      .replace(/\s+/g, " ")
      .trim();
    const lAmt = parseNumber(getNodeVal(l, "AMOUNT"));
    const key = `${lName}-${lAmt}`;

    if (lName && Math.abs(lAmt) > 0 && !processedLedgers.has(key)) {
      processedLedgers.add(key);
      ledgersToCreate.push({ name: lName, amount: lAmt });
      if (vTypeName.includes("SALES") && lAmt < 0)
        calculatedTotal += Math.abs(lAmt);
      if (vTypeName.includes("PURCHASE") && lAmt > 0) calculatedTotal += lAmt;
    }
  }

  if (calculatedTotal === 0 && ledgersToCreate.length > 0) {
    calculatedTotal = Math.max(
      ...ledgersToCreate.map((l) => Math.abs(l.amount))
    );
  }

  const processedInvKeys = new Set();
  for (const itemNode of allInventoryNodes) {
    const itemName = getNodeVal(itemNode, "STOCKITEMNAME")
      .replace(/\s+/g, " ")
      .trim();
    const rawAmt = getNodeVal(itemNode, "AMOUNT");
    const nodeKey = `${itemName}-${rawAmt}`;

    if (!itemName || processedInvKeys.has(nodeKey)) continue;
    processedInvKeys.add(nodeKey);

    const batchLists = itemNode.getElementsByTagName("BATCHALLOCATIONS.LIST");
    let itemsData: any[] = [];

    if (batchLists.length > 0) {
      for (let i = 0; i < batchLists.length; i++) {
        const b = batchLists[i];
        const bQty = parseNumber(
          getNodeVal(b, "ACTUALQTY") || getNodeVal(b, "BILLEDQTY")
        );
        const bUnit =
          (getNodeVal(b, "ACTUALQTY") || getNodeVal(b, "BILLEDQTY")).match(
            /[a-zA-Z]+/
          )?.[0] || "";
        const bAmount = parseNumber(getNodeVal(b, "AMOUNT"));

        // Rate Calculation Logic
        let bRate = parseRate(
          getNodeVal(b, "RATE") || getNodeVal(b, "BATCHRATE")
        );
        if (bRate === 0 && bAmount !== 0 && bQty !== 0) {
          bRate = Math.abs(bAmount / bQty);
        }

        itemsData.push({
          qty: bQty,
          rate: bRate,
          amount: bAmount,
          unit: bUnit,
        });
      }
    } else {
      const pQty = parseNumber(
        getNodeVal(itemNode, "ACTUALQTY") || getNodeVal(itemNode, "BILLEDQTY")
      );
      const pUnit =
        (
          getNodeVal(itemNode, "ACTUALQTY") || getNodeVal(itemNode, "BILLEDQTY")
        ).match(/[a-zA-Z]+/)?.[0] || "";
      const pAmount = parseNumber(getNodeVal(itemNode, "AMOUNT"));

      // Rate Calculation Logic
      let pRate = parseRate(getNodeVal(itemNode, "RATE"));
      if (pRate === 0 && pAmount !== 0 && pQty !== 0) {
        pRate = Math.abs(pAmount / pQty);
      }

      itemsData.push({ qty: pQty, rate: pRate, amount: pAmount, unit: pUnit });
    }

    for (const iData of itemsData) {
      if (Math.abs(iData.amount) > 0 || Math.abs(iData.qty) > 0) {
        inventoryToCreate.push({ name: itemName, ...iData });
      }
    }
  }

  const vNumProcessed = String(vNum);
  const partyName = getNodeVal(v, "PARTYLEDGERNAME") || "Cash";

  // 3. DATABASE OPERATIONS (Replaces Upsert with Find -> Update/Create)
  await prisma.$transaction(async (tx: any) => {
    let dbVoucher: any;
    const model = vTypeName.includes("SALES")
      ? tx.salesVoucher
      : tx.purchaseVoucher;

    // A. Check if exists
    const existing = await model.findUnique({
      where: { companyId_voucherNo: { companyId, voucherNo: vNumProcessed } },
    });

    if (existing) {
      // UPDATE: Keep existing ID, update details
      dbVoucher = await model.update({
        where: { id: existing.id },
        data: {
          date: vDate,
          totalAmount: calculatedTotal,
          narration,
          partyName,
          // Clear old entries via nested delete
          ledgerEntries: { deleteMany: {} },
          inventoryEntries: { deleteMany: {} },
        },
      });
    } else {
      // CREATE: Generate NEW Unique ID
      const newTxCode = await getUniqueTXID(); // Loop until unique 5-digit found

      dbVoucher = await model.create({
        data: {
          voucherNo: vNumProcessed,
          transactionCode: newTxCode,
          date: vDate,
          companyId,
          createdById: userId,
          status: "APPROVED",
          totalAmount: calculatedTotal,
          narration,
          partyName,
        },
      });
    }

    if (!dbVoucher) return;

    // B. Insert Details
    for (const l of ledgersToCreate) {
      const ledRec = await tx.ledger.upsert({
        where: { name_companyId: { name: l.name, companyId } },
        update: {},
        create: { name: l.name, companyId },
      });

      await model.update({
        where: { id: dbVoucher.id },
        data: {
          ledgerEntries: { create: { ledgerId: ledRec.id, amount: l.amount } },
        },
      });
    }

    for (const item of inventoryToCreate) {
      const stockItem = await tx.stockItem.upsert({
        where: { name_companyId: { name: item.name, companyId } },
        update: {},
        create: { name: item.name, companyId },
      });

      await model.update({
        where: { id: dbVoucher.id },
        data: {
          inventoryEntries: {
            create: {
              stockItemId: stockItem.id,
              quantity: item.qty,
              rate: item.rate,
              amount: item.amount,
              unit: item.unit,
            },
          },
        },
      });
    }
  });
}

export async function importTallyXML(formData: FormData, companyId: number) {
  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file" };
  const text = await file.text();
  const userId = (await getCurrentUserId()) || 1;
  return await processTallyXML(text, companyId, userId);
}
