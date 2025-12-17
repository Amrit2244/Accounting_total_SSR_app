"use server";

import { XMLParser } from "fast-xml-parser";

import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";

const encodedKey = new TextEncoder().encode(secretKey);

// --- AUTH & HELPERS ---

async function getCurrentUserId() {
  const cookieStore = await cookies();

  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey);

    return parseInt(payload.userId as string);
  } catch {
    return null;
  }
}

function parseTallyNumber(val: any): number {
  if (val === undefined || val === null) return 0;

  const str = String(Array.isArray(val) ? val[0] : val)
    .trim()
    .replace(/,/g, "");

  const match = str.match(/-?\d+(\.\d+)?/);

  // Flip sign: Tally Negative = Debit (Positive), Tally Positive = Credit (Negative)

  return match ? -parseFloat(match[0]) : 0;
}

function parseTallyDate(tallyDate: any) {
  if (!tallyDate) return new Date();

  const dateStr = String(tallyDate).trim();

  if (dateStr.length < 8) return new Date();

  const year = dateStr.substring(0, 4);

  const month = dateStr.substring(4, 6);

  const day = dateStr.substring(6, 8);

  return new Date(`${year}-${month}-${day}`);
}

function getName(obj: any): string {
  if (!obj) return "";

  if (typeof obj === "string") return obj.trim();

  if (obj["@_NAME"]) return String(obj["@_NAME"]).trim();

  if (obj.NAME) {
    if (Array.isArray(obj.NAME)) return String(obj.NAME[0]).trim();

    if (typeof obj.NAME === "object")
      return String(obj.NAME._text || "").trim();

    return String(obj.NAME).trim();
  }

  return String(obj.LEDGERNAME || obj.STOCKITEMNAME || "").trim();
}

async function getFallbackGroupId(companyId: number) {
  let group = await prisma.group.findFirst({
    where: { companyId, name: { in: ["Suspense Account", "Primary"] } },
  });

  if (!group) {
    group = await prisma.group.create({
      data: { name: "Suspense Account", companyId },
    });
  }

  return group.id;
}

export async function importTallyXML(prevState: any, formData: FormData) {
  const file = formData.get("xmlFile") as File;

  const companyId = parseInt(formData.get("companyId") as string);

  const userId = await getCurrentUserId();

  if (!userId) return { error: "Unauthorized" };

  try {
    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    let text = buffer.toString("utf-8");

    if (text.includes("\u0000")) text = buffer.toString("utf16le");

    text = text.replace(/<[\/]{0,1}[a-zA-Z0-9]+:/g, "<");

    const parser = new XMLParser({
      ignoreAttributes: false,

      attributeNamePrefix: "@_",

      parseTagValue: true,

      trimValues: true,
    });

    const jsonObj = parser.parse(text);

    const findItems = (obj: any, key: string): any[] => {
      let results: any[] = [];

      if (!obj || typeof obj !== "object") return results;

      if (obj[key]) {
        const found = Array.isArray(obj[key]) ? obj[key] : [obj[key]];

        results = results.concat(found);
      } else {
        for (const k in obj) {
          results = results.concat(findItems(obj[k], key));
        }
      }

      return results;
    };

    const allVouchers = findItems(jsonObj, "VOUCHER");

    let stats = { vouchers: 0 };

    for (const v of allVouchers) {
      const vchNo = String(v.VOUCHERNUMBER || v["@_VOUCHERNUMBER"] || "AUTO");

      const vchType = (
        v.VOUCHERTYPENAME ||
        v["@_VOUCHERTYPENAME"] ||
        "Journal"
      ).toString();

      const date = parseTallyDate(v.DATE || v["@_DATE"]);

      const exists = await prisma.voucher.findFirst({
        where: { voucherNo: vchNo, companyId, type: vchType },
      });

      if (exists) continue;

      await prisma.$transaction(async (tx) => {
        const accountingEntries = [];

        let totalDebitValue = 0;

        // --- 1. COLLECT ALL LEDGER ENTRIES ---

        // Includes main ledger entries and nested accounting allocations from inventory

        let rawLedgers =
          v["ALLLEDGERENTRIES.LIST"] || v["LEDGERENTRIES.LIST"] || [];

        if (!Array.isArray(rawLedgers)) rawLedgers = [rawLedgers];

        const rawInventory =
          v["ALLINVENTORYENTRIES.LIST"] || v["INVENTORYENTRIES.LIST"] || [];

        const inventoryList = Array.isArray(rawInventory)
          ? rawInventory
          : [rawInventory];

        // Process main ledger entries

        for (const ent of rawLedgers) {
          const lName = getName(ent);

          if (!lName) continue;

          const amt = parseTallyNumber(ent.AMOUNT);

          if (amt > 0) totalDebitValue += amt;

          let ledger = await tx.ledger.findFirst({
            where: { name: lName, companyId },
          });

          if (!ledger) {
            const fallbackId = await getFallbackGroupId(companyId);

            ledger = await tx.ledger.create({
              data: {
                name: lName,
                companyId,
                groupId: fallbackId,
                openingBalance: 0,
              },
            });
          }

          accountingEntries.push({
            ledgerId: ledger.id,
            ledgerName: lName,
            amount: amt,
          });
        }

        // --- 2. PROCESS INVENTORY & NESTED SALES LEDGERS ---

        const inventoryEntries = [];

        for (const inv of inventoryList) {
          const iName = getName(inv);

          if (!iName) continue;

          let stockItem = await tx.stockItem.findFirst({
            where: { name: iName, companyId },
          });

          if (!stockItem)
            stockItem = await tx.stockItem.create({
              data: { name: iName, companyId },
            });

          const rawQtyStr = inv.BILLEDQTY || inv.ACTUALQTY || "0";

          const qty = Math.abs(parseTallyNumber(rawQtyStr));

          const unit = String(rawQtyStr).match(/[a-zA-Z]+/)?.[0] || "";

          inventoryEntries.push({
            stockItemId: stockItem.id,

            itemName: iName,

            quantity: qty,

            rate: Math.abs(parseTallyNumber(inv.RATE)),

            amount: Math.abs(parseTallyNumber(inv.AMOUNT)),

            unit: unit,
          });

          // Extract the nested Sales A/c from inventory

          let allocations = inv["ACCOUNTINGALLOCATIONS.LIST"] || [];

          if (!Array.isArray(allocations)) allocations = [allocations];

          for (const alloc of allocations) {
            const aName = getName(alloc);

            const aAmt = parseTallyNumber(alloc.AMOUNT);

            let aLedger = await tx.ledger.findFirst({
              where: { name: aName, companyId },
            });

            if (!aLedger) {
              const fallbackId = await getFallbackGroupId(companyId);

              aLedger = await tx.ledger.create({
                data: { name: aName, companyId, groupId: fallbackId },
              });
            }

            accountingEntries.push({
              ledgerId: aLedger.id,
              ledgerName: aName,
              amount: aAmt,
            });
          }

          const isSale = vchType.toLowerCase().includes("sale");

          await tx.stockItem.update({
            where: { id: stockItem.id },

            data: {
              quantity: isSale ? { decrement: qty } : { increment: qty },
            },
          });
        }

        await tx.voucher.create({
          data: {
            date,
            voucherNo: vchNo,
            type: vchType,
            companyId,
            status: "APPROVED",

            createdById: userId,
            totalAmount: totalDebitValue,
            narration: v.NARRATION || "",

            transactionCode:
              "IMP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),

            entries: { create: accountingEntries },

            inventory: { create: inventoryEntries },
          },
        });

        stats.vouchers++;
      });
    }

    revalidatePath(`/companies/${companyId}`);

    return {
      success: true,
      message: `Successfully Imported ${stats.vouchers} Vouchers.`,
    };
  } catch (err: any) {
    return { error: `Import Failed: ${err.message}` };
  }
}
