"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// --- CONFIG ---
const BATCH_SIZE = 20;
const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- HELPERS ---
export async function getCurrentUserId() {
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
  return String(
    obj.LEDGERNAME || obj.STOCKITEMNAME || obj.STOCKGROUPNAME || ""
  ).trim();
}

// ✅ MAIN LOGIC FUNCTION
export async function processTallyXML(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  try {
    let text = xmlContent.replace(/<[\/]{0,1}[a-zA-Z0-9]+:/g, "<");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
      textNodeName: "_text",
    });

    let rawChunks = text.match(/<TALLYMESSAGE[\s\S]*?<\/TALLYMESSAGE>/gi) || [];
    if (rawChunks.length === 0) {
      rawChunks =
        text.match(
          /<(GROUP|LEDGER|UNIT|STOCKGROUP|STOCKITEM|VOUCHER)[\s\S]*?<\/\1>/gi
        ) || [];
    }
    if (rawChunks.length === 0) return { error: `No valid Tally Data found.` };

    console.log(
      `📂 Processing ${rawChunks.length} blocks for Company ${companyId}...`
    );

    const stats = {
      groups: 0,
      stockGroups: 0,
      ledgers: 0,
      units: 0,
      stockItems: 0,
      vouchers: 0,
    };

    // --- CACHE MASTERS ---
    const existingGroups = await prisma.group.findMany({
      where: { companyId },
      select: { name: true, id: true },
    });
    const groupMap = new Map(
      existingGroups.map((g) => [g.name.toLowerCase(), g.id])
    );

    // ✅ NEW: Cache Stock Groups
    const existingStockGroups = await prisma.stockGroup.findMany({
      where: { companyId },
      select: { name: true, id: true },
    });
    const stockGroupMap = new Map(
      existingStockGroups.map((g) => [g.name.toLowerCase(), g.id])
    );

    const existingLedgers = await prisma.ledger.findMany({
      where: { companyId },
      select: { name: true, id: true },
    });
    const ledgerMap = new Map(
      existingLedgers.map((l) => [l.name.toLowerCase(), l.id])
    );

    const existingItems = await prisma.stockItem.findMany({
      where: { companyId },
      select: { name: true, id: true },
    });
    const itemMap = new Map(
      existingItems.map((i) => [i.name.toLowerCase(), i.id])
    );

    const existingUnits = await prisma.unit.findMany({
      where: { companyId },
      select: { symbol: true, id: true },
    });
    const unitMap = new Map(
      existingUnits.map((u) => [u.symbol.toLowerCase(), u.id])
    );

    // Helper: Get Primary Group
    const getPrimaryGroupId = async () => {
      if (groupMap.has("primary")) return groupMap.get("primary")!;
      const g = await prisma.group.create({
        data: { name: "Primary", companyId },
      });
      groupMap.set("primary", g.id);
      return g.id;
    };

    // Helper: Get Fallback Group
    let fallbackGroupId: number | null = null;
    const getFallbackId = async () => {
      if (fallbackGroupId) return fallbackGroupId;
      if (groupMap.has("suspense account"))
        return groupMap.get("suspense account")!;
      const g = await prisma.group.create({
        data: { name: "Suspense Account", companyId },
      });
      groupMap.set("suspense account", g.id);
      fallbackGroupId = g.id;
      return g.id;
    };

    // --- SEPARATE DATA ---
    const groupsToProcess: any[] = [];
    const stockGroupsToProcess: any[] = []; // ✅ NEW: Separate array for Stock Groups
    const ledgersToProcess: any[] = [];
    const unitsToProcess: any[] = [];
    const itemsToProcess: any[] = [];
    const vouchersToProcess: any[] = [];

    for (const rawMsg of rawChunks) {
      const safeXML = rawMsg.startsWith("<")
        ? rawMsg
        : `<ROOT>${rawMsg}</ROOT>`;
      const jsonObj = parser.parse(safeXML);
      const data = jsonObj.TALLYMESSAGE || jsonObj;

      if (data.GROUP) groupsToProcess.push(data.GROUP);
      else if (data.STOCKGROUP)
        stockGroupsToProcess.push(data.STOCKGROUP); // ✅ Push to correct array
      else if (data.LEDGER) ledgersToProcess.push(data.LEDGER);
      else if (data.UNIT) unitsToProcess.push(data.UNIT);
      else if (data.STOCKITEM) itemsToProcess.push(data.STOCKITEM);
      else if (data.VOUCHER) vouchersToProcess.push(data.VOUCHER);
    }

    // --- PHASE 1: ACCOUNTING GROUPS ---
    for (const grp of groupsToProcess) {
      const name = getName(grp);
      if (name && name !== "Primary" && !groupMap.has(name.toLowerCase())) {
        const newGrp = await prisma.group.create({ data: { name, companyId } });
        groupMap.set(name.toLowerCase(), newGrp.id);
        stats.groups++;
      }
    }

    // --- PHASE 1.5: STOCK GROUPS (NEW) ---
    // We process these separately so they go into 'StockGroup' table
    for (const sg of stockGroupsToProcess) {
      const name = getName(sg);
      if (
        name &&
        name !== "Primary" &&
        !stockGroupMap.has(name.toLowerCase())
      ) {
        // Handle Parent (Stock Groups can have parents too)
        let parentName = sg["@_PARENT"] || sg.PARENT;
        if (Array.isArray(parentName)) parentName = parentName[0];
        parentName = parentName ? String(parentName).trim() : "";

        let parentId: number | null = null;
        if (parentName && parentName !== "Primary") {
          parentId = stockGroupMap.get(parentName.toLowerCase()) || null;
          // Create parent if missing
          if (!parentId) {
            const newParent = await prisma.stockGroup.create({
              data: { name: parentName, companyId },
            });
            parentId = newParent.id;
            stockGroupMap.set(parentName.toLowerCase(), parentId);
            stats.stockGroups++;
          }
        }

        const newSg = await prisma.stockGroup.create({
          data: { name, companyId, parentId },
        });
        stockGroupMap.set(name.toLowerCase(), newSg.id);
        stats.stockGroups++;
      }
    }

    // --- PHASE 2: UNITS ---
    for (const unit of unitsToProcess) {
      const name = getName(unit);
      const symbol = unit.ORIGINALNAME || unit.NAME || name;
      if (symbol && !unitMap.has(String(symbol).toLowerCase())) {
        const newUnit = await prisma.unit.create({
          data: {
            name: String(name || symbol),
            symbol: String(symbol),
            companyId,
          },
        });
        unitMap.set(String(symbol).toLowerCase(), newUnit.id);
        stats.units++;
      }
    }

    // --- PHASE 3: LEDGERS ---
    for (const led of ledgersToProcess) {
      const name = getName(led);
      if (name && !ledgerMap.has(name.toLowerCase())) {
        let parentName = led["@_PARENT"] || led.PARENT;
        if (Array.isArray(parentName)) parentName = parentName[0];
        parentName = parentName ? String(parentName).trim() : "";

        let groupId: number | undefined;

        if (
          name.toLowerCase() === "profit & loss a/c" ||
          name.toLowerCase().includes("profit & loss")
        ) {
          groupId = await getPrimaryGroupId();
        } else if (parentName) {
          groupId = groupMap.get(parentName.toLowerCase());
          if (!groupId) {
            const newParent = await prisma.group.create({
              data: { name: parentName, companyId },
            });
            groupId = newParent.id;
            groupMap.set(parentName.toLowerCase(), groupId);
            stats.groups++;
          }
        }
        if (!groupId) groupId = await getFallbackId();

        const newLedger = await prisma.ledger.create({
          data: {
            name,
            companyId,
            groupId: groupId!,
            openingBalance: parseTallyNumber(led.OPENINGBALANCE),
          },
        });
        ledgerMap.set(name.toLowerCase(), newLedger.id);
        stats.ledgers++;
      }
    }

    // --- PHASE 4: ITEMS ---
    for (const item of itemsToProcess) {
      const name = getName(item);
      if (name && !itemMap.has(name.toLowerCase())) {
        // Link Stock Group if present
        let parentName = item["@_PARENT"] || item.PARENT;
        if (Array.isArray(parentName)) parentName = parentName[0];
        parentName = parentName ? String(parentName).trim() : "";

        let groupId: number | null = null;
        if (parentName && parentName !== "Primary") {
          groupId = stockGroupMap.get(parentName.toLowerCase()) || null;
          // Create Stock Group if missing
          if (!groupId) {
            const newSg = await prisma.stockGroup.create({
              data: { name: parentName, companyId },
            });
            groupId = newSg.id;
            stockGroupMap.set(parentName.toLowerCase(), groupId);
            stats.stockGroups++;
          }
        }

        // Link Unit if present
        let unitName = item.BASEUNITS;
        let unitId = unitName
          ? unitMap.get(String(unitName).toLowerCase())
          : null;

        const newItm = await prisma.stockItem.create({
          data: {
            name,
            companyId,
            groupId: groupId, // Link to Stock Group
            unitId: unitId,
            openingQty: parseTallyNumber(item.OPENINGBALANCE),
            openingValue: Math.abs(parseTallyNumber(item.OPENINGVALUE)),
            quantity: parseTallyNumber(item.OPENINGBALANCE),
            gstRate: 0,
          },
        });
        itemMap.set(name.toLowerCase(), newItm.id);
        stats.stockItems++;
      }
    }

    // --- PHASE 5: VOUCHERS ---
    console.log(`🚀 Processing ${vouchersToProcess.length} vouchers...`);
    for (let i = 0; i < vouchersToProcess.length; i += BATCH_SIZE) {
      const batch = vouchersToProcess.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (voucherData) => {
          try {
            if (
              voucherData["@_ACTION"] === "Delete" ||
              voucherData.ACTION === "Delete"
            )
              return;
            const vchNo = String(
              voucherData.VOUCHERNUMBER ||
                voucherData["@_VOUCHERNUMBER"] ||
                "AUTO"
            );
            const vchType = (
              voucherData.VOUCHERTYPENAME || "Journal"
            ).toString();
            const date = parseTallyDate(
              voucherData.DATE || voucherData["@_DATE"]
            );

            const exists = await prisma.voucher.findFirst({
              where: { voucherNo: vchNo, companyId, type: vchType },
              select: { id: true },
            });
            if (exists) return;

            const accountingEntries: any[] = [];
            const inventoryEntries: any[] = [];
            let totalDebitValue = 0;

            // LEDGERS
            let rawLedgers =
              voucherData["ALLLEDGERENTRIES.LIST"] ||
              voucherData["LEDGERENTRIES.LIST"] ||
              [];
            if (!Array.isArray(rawLedgers)) rawLedgers = [rawLedgers];

            for (const ent of rawLedgers) {
              const lName = getName(ent);
              if (!lName) continue;
              const amt = -parseTallyNumber(ent.AMOUNT);
              if (amt > 0) totalDebitValue += amt;

              let ledgerId = ledgerMap.get(lName.toLowerCase());
              if (!ledgerId) {
                let dbLedger = await prisma.ledger.findFirst({
                  where: { companyId, name: lName },
                });
                if (!dbLedger) {
                  const fallbackId = await getFallbackId();
                  dbLedger = await prisma.ledger.create({
                    data: {
                      name: lName,
                      companyId,
                      groupId: fallbackId,
                      openingBalance: 0,
                    },
                  });
                }
                ledgerId = dbLedger.id;
                ledgerMap.set(lName.toLowerCase(), ledgerId);
              }
              accountingEntries.push({
                ledgerId,
                ledgerName: lName,
                amount: amt,
              });
            }

            // INVENTORY
            let rawInv =
              voucherData["ALLINVENTORYENTRIES.LIST"] ||
              voucherData["INVENTORYENTRIES.LIST"] ||
              [];
            if (!Array.isArray(rawInv))
              rawInv = Array.isArray(rawInv) ? rawInv : [rawInv];

            for (const inv of rawInv) {
              const iName = getName(inv);
              if (!iName) continue;
              let itemId = itemMap.get(iName.toLowerCase());
              if (!itemId) {
                const dbItem = await prisma.stockItem.create({
                  data: { name: iName, companyId, gstRate: 0 },
                });
                itemId = dbItem.id;
                itemMap.set(iName.toLowerCase(), itemId);
              }
              const qtyStr = inv.BILLEDQTY || inv.ACTUALQTY || "0";
              const qty = Math.abs(parseTallyNumber(qtyStr));
              inventoryEntries.push({
                stockItemId: itemId,
                itemName: iName,
                quantity: qty,
                rate: Math.abs(parseTallyNumber(inv.RATE)),
                amount: Math.abs(parseTallyNumber(inv.AMOUNT)),
                unit: String(qtyStr).match(/[a-zA-Z]+/)?.[0] || "",
              });

              // ALLOCATIONS
              let allocs = inv["ACCOUNTINGALLOCATIONS.LIST"] || [];
              if (!Array.isArray(allocs)) allocs = [allocs];
              for (const al of allocs) {
                const aName = getName(al);
                const aAmt = -parseTallyNumber(al.AMOUNT);
                let aLedgerId = ledgerMap.get(aName.toLowerCase());
                if (!aLedgerId) {
                  let dbALedger = await prisma.ledger.findFirst({
                    where: { companyId, name: aName },
                  });
                  if (!dbALedger) {
                    const fid = await getFallbackId();
                    dbALedger = await prisma.ledger.create({
                      data: { name: aName, companyId, groupId: fid },
                    });
                  }
                  aLedgerId = dbALedger.id;
                  ledgerMap.set(aName.toLowerCase(), aLedgerId);
                }
                accountingEntries.push({
                  ledgerId: aLedgerId,
                  ledgerName: aName,
                  amount: aAmt,
                });
              }
            }

            await prisma.$transaction(async (tx) => {
              const isSale = vchType.toLowerCase().includes("sale");
              for (const invEntry of inventoryEntries) {
                await tx.stockItem.update({
                  where: { id: invEntry.stockItemId },
                  data: {
                    quantity: isSale
                      ? { decrement: invEntry.quantity }
                      : { increment: invEntry.quantity },
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
            });
            stats.vouchers++;
          } catch (err) {
            console.error(`Skipping Voucher:`, err);
          }
        })
      );
    }

    revalidatePath(`/companies/${companyId}`);
    return {
      success: true,
      message: `Imported: ${stats.groups} Groups, ${stats.stockGroups} Stock Groups, ${stats.ledgers} Ledgers, ${stats.stockItems} Items, ${stats.vouchers} Vouchers.`,
    };
  } catch (err: any) {
    return { error: `Processing Failed: ${err.message}` };
  }
}

// SERVER ACTION WRAPPER
export async function importTallyXML(prevState: any, formData: FormData) {
  const file = formData.get("xmlFile") as File;
  const companyId = parseInt(formData.get("companyId") as string);
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };
  if (!file) return { error: "No file" };

  const buffer = await file.arrayBuffer();
  const buf = Buffer.from(buffer);
  let text = buf.toString("utf-8");
  if (text.includes("\u0000")) text = buf.toString("utf16le");

  return await processTallyXML(text, companyId, userId);
}
