"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

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
  return match ? parseFloat(match[0]) : 0;
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

function findKeyInObject(obj: any, key: string): any {
  if (!obj || typeof obj !== "object") return null;
  if (obj[key]) return obj[key];
  for (const k of Object.keys(obj)) {
    const result = findKeyInObject(obj[k], key);
    if (result) return result;
  }
  return null;
}

function getName(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj.trim();
  if (obj["@_NAME"]) return String(obj["@_NAME"]).trim();
  if (obj.NAME) {
    const n = Array.isArray(obj.NAME) ? obj.NAME[0] : obj.NAME;
    return typeof n === "object"
      ? String(n._text || "").trim()
      : String(n).trim();
  }
  return String(obj.LEDGERNAME || obj.STOCKITEMNAME || "").trim();
}

export async function importTallyXML(prevState: any, formData: FormData) {
  const file = formData.get("xmlFile") as File;
  const companyId = parseInt(formData.get("companyId") as string);
  if (!file || file.name === "undefined") return { error: "Invalid File" };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = buffer.toString("utf-8");
    if (text.includes("\u0000")) text = buffer.toString("utf16le");
    text = text.replace(/<[\/]{0,1}[a-zA-Z0-9]+:/g, "<");

    let rawChunks = text.match(/<TALLYMESSAGE[\s\S]*?<\/TALLYMESSAGE>/gi) || [];
    if (rawChunks.length === 0) {
      rawChunks =
        text.match(
          /<(GROUP|LEDGER|UNIT|STOCKGROUP|STOCKITEM|VOUCHER)[\s\S]*?<\/\1>/gi
        ) || [];
    }
    if (rawChunks.length === 0) return { error: `No valid Tally Data found.` };

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
      textNodeName: "_text",
    });

    let stats = {
      groups: 0,
      ledgers: 0,
      units: 0,
      stockGroups: 0,
      stockItems: 0,
      vouchers: 0,
    };

    // PASS 1: Create all Groups first
    for (const rawMsg of rawChunks) {
      const safeXML = rawMsg.startsWith("<")
        ? rawMsg
        : `<ROOT>${rawMsg}</ROOT>`;
      const jsonObj = parser.parse(safeXML);
      const data = jsonObj.TALLYMESSAGE || jsonObj;
      const groupData = findKeyInObject(data, "GROUP");
      const stockGroupData = findKeyInObject(data, "STOCKGROUP");

      if (groupData) {
        const name = getName(groupData);
        if (name && name !== "Primary") {
          const exists = await prisma.group.findFirst({
            where: { name, companyId },
          });
          if (!exists) {
            await prisma.group.create({ data: { name, companyId } });
            stats.groups++;
          }
        }
      }
      if (stockGroupData) {
        const name = getName(stockGroupData);
        if (name && name !== "Primary") {
          const exists = await prisma.stockGroup.findFirst({
            where: { name, companyId },
          });
          if (!exists) {
            await prisma.stockGroup.create({ data: { name, companyId } });
            stats.stockGroups++;
          }
        }
      }
    }

    // PASS 2: Create Ledgers, Items, and Vouchers
    for (const rawMsg of rawChunks) {
      const safeXML = rawMsg.startsWith("<")
        ? rawMsg
        : `<ROOT>${rawMsg}</ROOT>`;
      const jsonObj = parser.parse(safeXML);
      const data = jsonObj.TALLYMESSAGE || jsonObj;

      const ledgerData = findKeyInObject(data, "LEDGER");
      const unitData = findKeyInObject(data, "UNIT");
      const stockItemData = findKeyInObject(data, "STOCKITEM");
      const voucherData = findKeyInObject(data, "VOUCHER");

      if (ledgerData) {
        const name = getName(ledgerData);
        if (name) {
          const existing = await prisma.ledger.findFirst({
            where: { name, companyId },
          });
          if (!existing) {
            let parentName = ledgerData["@_PARENT"] || ledgerData.PARENT;
            if (Array.isArray(parentName)) parentName = parentName[0];

            let groupId = null;

            // ✅ SPECIAL FIX FOR PROFIT & LOSS ACCOUNT
            if (
              name === "Profit & Loss A/c" ||
              (name.toLowerCase().includes("profit") &&
                name.toLowerCase().includes("loss"))
            ) {
              const primaryGroup = await prisma.group.findFirst({
                where: {
                  name: { in: ["Primary", "Capital Account"] },
                  companyId,
                },
              });
              if (primaryGroup) groupId = primaryGroup.id;
            }

            if (!groupId && parentName) {
              const g = await prisma.group.findFirst({
                where: { name: String(parentName).trim(), companyId },
              });
              if (g) groupId = g.id;
            }

            if (!groupId) groupId = await getFallbackGroupId(companyId);

            await prisma.ledger.create({
              data: {
                name,
                groupId,
                companyId,
                openingBalance: parseTallyNumber(ledgerData.OPENINGBALANCE),
              },
            });
            stats.ledgers++;
          }
        }
      } else if (unitData) {
        const name = getName(unitData);
        const symbol = unitData.ORIGINALNAME || unitData.NAME || name;
        if (symbol) {
          const existing = await prisma.unit.findFirst({
            where: { companyId, symbol: String(symbol) },
          });
          if (!existing) {
            await prisma.unit.create({
              data: {
                name: String(name || symbol),
                symbol: String(symbol),
                companyId,
              },
            });
            stats.units++;
          }
        }
      } else if (stockItemData) {
        const name = getName(stockItemData);
        if (name) {
          const existing = await prisma.stockItem.findFirst({
            where: { name, companyId },
          });
          if (!existing) {
            let groupId = null;
            let parentName = stockItemData.PARENT;
            if (parentName && parentName !== "Primary") {
              const g = await prisma.stockGroup.findFirst({
                where: { name: String(parentName), companyId },
              });
              if (g) groupId = g.id;
            }
            let unitId = null;
            let unitName = stockItemData.BASEUNITS;
            if (unitName) {
              const u = await prisma.unit.findFirst({
                where: { symbol: String(unitName), companyId },
              });
              if (u) unitId = u.id;
            }
            const opQty = parseTallyNumber(stockItemData.OPENINGBALANCE);
            await prisma.stockItem.create({
              data: {
                name,
                companyId,
                groupId,
                unitId,
                openingQty: opQty,
                openingValue: Math.abs(
                  parseTallyNumber(stockItemData.OPENINGVALUE)
                ),
                quantity: opQty,
                gstRate: 0,
              },
            });
            stats.stockItems++;
          }
        }
      } else if (voucherData) {
        const vchNo = String(
          voucherData.VOUCHERNUMBER || voucherData["@_VOUCHERNUMBER"] || "AUTO"
        );
        const vchType = (voucherData.VOUCHERTYPENAME || "").toString();
        const date = parseTallyDate(voucherData.DATE || voucherData["@_DATE"]);

        const exists = await prisma.voucher.findFirst({
          where: { voucherNo: vchNo, companyId, type: vchType },
        });
        if (!exists) {
          await prisma.$transaction(async (tx) => {
            const accountingEntries = [];
            let totalDebitValue = 0;

            let rawLedgers =
              voucherData["ALLLEDGERENTRIES.LIST"] ||
              voucherData["LEDGERENTRIES.LIST"] ||
              [];
            if (!Array.isArray(rawLedgers)) rawLedgers = [rawLedgers];

            let rawInv =
              voucherData["ALLINVENTORYENTRIES.LIST"] ||
              voucherData["INVENTORYENTRIES.LIST"] ||
              [];
            const inventoryList = Array.isArray(rawInv) ? rawInv : [rawInv];

            for (const ent of rawLedgers) {
              const lName = getName(ent);
              if (!lName) continue;
              const amt = -parseTallyNumber(ent.AMOUNT);
              if (amt > 0) totalDebitValue += amt;

              let ledger = await tx.ledger.findFirst({
                where: { name: lName, companyId },
              });
              if (!ledger) {
                const fid = await getFallbackGroupId(companyId);
                ledger = await tx.ledger.create({
                  data: {
                    name: lName,
                    companyId,
                    groupId: fid,
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

            const inventoryEntries = [];
            for (const inv of inventoryList) {
              const iName = getName(inv);
              if (!iName) continue;

              let item = await tx.stockItem.findFirst({
                where: { name: iName, companyId },
              });
              if (!item)
                item = await tx.stockItem.create({
                  data: { name: iName, companyId },
                });

              const qtyStr = inv.BILLEDQTY || inv.ACTUALQTY || "0";
              const qty = Math.abs(parseTallyNumber(qtyStr));

              inventoryEntries.push({
                stockItemId: item.id,
                itemName: iName,
                quantity: qty,
                rate: Math.abs(parseTallyNumber(inv.RATE)),
                amount: Math.abs(parseTallyNumber(inv.AMOUNT)),
                unit: String(qtyStr).match(/[a-zA-Z]+/)?.[0] || "",
              });

              let allocs = inv["ACCOUNTINGALLOCATIONS.LIST"] || [];
              if (!Array.isArray(allocs)) allocs = [allocs];
              for (const al of allocs) {
                const aName = getName(al);
                const aAmt = -parseTallyNumber(al.AMOUNT);
                let aLedger = await tx.ledger.findFirst({
                  where: { name: aName, companyId },
                });
                if (!aLedger) {
                  const fid = await getFallbackGroupId(companyId);
                  aLedger = await tx.ledger.create({
                    data: { name: aName, companyId, groupId: fid },
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
                where: { id: item.id },
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
                narration: voucherData.NARRATION || "",
                transactionCode: Math.floor(
                  10000 + Math.random() * 90000
                ).toString(),
                entries: { create: accountingEntries },
                inventory: { create: inventoryEntries },
              },
            });
            stats.vouchers++;
          });
        }
      }
    }

    revalidatePath(`/companies/${companyId}`);
    return {
      success: true,
      message: `Imported: ${stats.groups} Groups, ${stats.ledgers} Ledgers, ${stats.stockItems} Items, ${stats.vouchers} Vouchers.`,
    };
  } catch (err: any) {
    return { error: `Processing Failed: ${err.message}` };
  }
}
