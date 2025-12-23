"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// --- CONFIG ---
const BATCH_SIZE = 50;
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
      ? String(n._text || n["#text"] || "").trim()
      : String(n).trim();
  }
  return String(
    obj.LEDGERNAME || obj.STOCKITEMNAME || obj.STOCKGROUPNAME || ""
  ).trim();
}

async function getNextAutoNumber(companyId: number, type: string) {
  const seq = await prisma.voucherSequence.upsert({
    where: { companyId_voucherType: { companyId, voucherType: type } },
    update: { lastNo: { increment: 1 } },
    create: { companyId, voucherType: type, lastNo: 1 },
  });
  return seq.lastNo;
}

// ✅ MAIN LOGIC FUNCTION
export async function processTallyXML(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  try {
    // 1. CLEAN XML
    let text = xmlContent
      .replace(/<[\/]{0,1}[a-zA-Z0-9]+:/g, "<")
      .replace(/\sxmlns[^"]+"[^"]+"/g, "");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
      textNodeName: "_text",
    });

    // 2. PARSE
    let rawChunks =
      text.match(/<TALLYMESSAGE\b[\s\S]*?<\/TALLYMESSAGE>/gi) || [];
    if (rawChunks.length === 0) {
      rawChunks =
        text.match(
          /<(GROUP|LEDGER|UNIT|STOCKGROUP|STOCKITEM|VOUCHER|VOUCHERTYPE)[\s\S]*?<\/\1>/gi
        ) || [];
    }
    if (rawChunks.length === 0) return { error: `No valid Tally Data found.` };

    const stats = {
      groups: 0,
      stockGroups: 0,
      ledgers: 0,
      units: 0,
      stockItems: 0,
      sales: 0,
      purchase: 0,
      payment: 0,
      receipt: 0,
      contra: 0,
      journal: 0,
      stockJournal: 0,
      skipped: 0,
    };

    // --- DB CACHE ---
    interface IdName {
      name: string;
      id: number;
    }
    interface IdSymbol {
      symbol: string;
      id: number;
    }

    const groupMap = new Map<string, number>(
      (
        await prisma.group.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((g: IdName) => [g.name.toLowerCase(), g.id])
    );

    const stockGroupMap = new Map<string, number>(
      (
        await prisma.stockGroup.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((g: IdName) => [g.name.toLowerCase(), g.id])
    );

    const ledgerMap = new Map<string, number>(
      (
        await prisma.ledger.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((l: IdName) => [l.name.toLowerCase(), l.id])
    );

    const itemMap = new Map<string, number>(
      (
        await prisma.stockItem.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((i: IdName) => [i.name.toLowerCase(), i.id])
    );

    const unitMap = new Map<string, number>(
      (
        await prisma.unit.findMany({
          where: { companyId },
          select: { symbol: true, id: true },
        })
      ).map((u: IdSymbol) => [u.symbol.toLowerCase(), u.id])
    );

    // --- HELPERS ---
    const getPrimaryGroupId = async (): Promise<number> => {
      const existing = groupMap.get("primary");
      if (existing !== undefined) return existing;
      const g = await prisma.group.create({
        data: { name: "Primary", companyId },
      });
      groupMap.set("primary", g.id);
      return g.id;
    };

    let fallbackGroupId: number | null = null;
    const getFallbackId = async (): Promise<number> => {
      if (fallbackGroupId) return fallbackGroupId;
      const existing = groupMap.get("suspense account");
      if (existing !== undefined) return existing;
      const g = await prisma.group.create({
        data: { name: "Suspense Account", companyId },
      });
      groupMap.set("suspense account", g.id);
      fallbackGroupId = g.id;
      return g.id;
    };

    // --- SEPARATE DATA ---
    const groupsToProcess: any[] = [];
    const stockGroupsToProcess: any[] = [];
    const ledgersToProcess: any[] = [];
    const unitsToProcess: any[] = [];
    const itemsToProcess: any[] = [];
    const vouchersToProcess: any[] = [];

    const voucherTypeMap = new Map<string, string>();

    for (const rawMsg of rawChunks) {
      const safeXML = rawMsg.startsWith("<")
        ? rawMsg
        : `<ROOT>${rawMsg}</ROOT>`;
      const jsonObj = parser.parse(safeXML);
      const data = jsonObj.TALLYMESSAGE || jsonObj;

      if (data.GROUP) groupsToProcess.push(data.GROUP);
      else if (data.STOCKGROUP) stockGroupsToProcess.push(data.STOCKGROUP);
      else if (data.LEDGER) ledgersToProcess.push(data.LEDGER);
      else if (data.UNIT) unitsToProcess.push(data.UNIT);
      else if (data.STOCKITEM) itemsToProcess.push(data.STOCKITEM);
      else if (data.VOUCHER) vouchersToProcess.push(data.VOUCHER);
      else if (data.VOUCHERTYPE) {
        const vName = getName(data.VOUCHERTYPE);
        let vParent =
          data.VOUCHERTYPE.PARENT || data.VOUCHERTYPE["@_PARENT"] || "";
        if (vParent)
          voucherTypeMap.set(
            vName.toLowerCase(),
            String(vParent).toLowerCase()
          );
      }
    }

    // PHASE 1: MASTERS
    for (const grp of groupsToProcess) {
      const name = getName(grp);
      if (name && name !== "Primary" && !groupMap.has(name.toLowerCase())) {
        const newGrp = await prisma.group.create({ data: { name, companyId } });
        groupMap.set(name.toLowerCase(), newGrp.id);
        stats.groups++;
      }
    }

    for (const sg of stockGroupsToProcess) {
      const name = getName(sg);
      if (
        name &&
        name !== "Primary" &&
        !stockGroupMap.has(name.toLowerCase())
      ) {
        const newSg = await prisma.stockGroup.create({
          data: { name, companyId },
        });
        stockGroupMap.set(name.toLowerCase(), newSg.id);
        stats.stockGroups++;
      }
    }

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

    for (const led of ledgersToProcess) {
      const name = getName(led);
      if (name && !ledgerMap.has(name.toLowerCase())) {
        let parentName = led["@_PARENT"] || led.PARENT;
        if (Array.isArray(parentName)) parentName = parentName[0];
        const pStr = parentName ? String(parentName).trim() : "";

        let groupId: number | undefined;
        if (name.toLowerCase().includes("profit & loss")) {
          groupId = await getPrimaryGroupId();
        } else if (pStr) {
          groupId = groupMap.get(pStr.toLowerCase());
          if (groupId === undefined) {
            const newParent = await prisma.group.create({
              data: { name: pStr, companyId },
            });
            const createdId: number = newParent.id;
            groupMap.set(pStr.toLowerCase(), createdId);
            groupId = createdId;
            stats.groups++;
          }
        }

        const finalGroupId: number =
          groupId !== undefined ? groupId : await getFallbackId();

        const newLedger = await prisma.ledger.create({
          data: {
            name,
            companyId,
            groupId: finalGroupId,
            openingBalance: parseTallyNumber(led.OPENINGBALANCE),
          },
        });
        ledgerMap.set(name.toLowerCase(), newLedger.id);
        stats.ledgers++;
      }
    }

    for (const item of itemsToProcess) {
      const name = getName(item);
      if (name && !itemMap.has(name.toLowerCase())) {
        let parentName = item["@_PARENT"] || item.PARENT;
        if (Array.isArray(parentName)) parentName = parentName[0];
        const pStr = parentName ? String(parentName).toLowerCase() : "";

        let groupId: number | null = null;
        if (pStr) {
          const cachedId = stockGroupMap.get(pStr);
          if (cachedId !== undefined) {
            groupId = cachedId;
          } else {
            const newSg = await prisma.stockGroup.create({
              data: { name: pStr, companyId },
            });
            const newId: number = newSg.id;
            stockGroupMap.set(pStr, newId);
            groupId = newId;
          }
        }

        let unitId = item.BASEUNITS
          ? unitMap.get(String(item.BASEUNITS).toLowerCase())
          : null;

        const newItm = await prisma.stockItem.create({
          data: {
            name,
            companyId,
            groupId: groupId,
            unitId: unitId ?? null,
            quantity: parseTallyNumber(item.OPENINGBALANCE),
            gstRate: 0,
          },
        });
        itemMap.set(name.toLowerCase(), newItm.id);
        stats.stockItems++;
      }
    }

    // ✅ PHASE 2: VOUCHERS
    for (let i = 0; i < vouchersToProcess.length; i += BATCH_SIZE) {
      const batch = vouchersToProcess.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (voucherData: any) => {
          try {
            let rawVchType = (
              voucherData.VOUCHERTYPENAME ||
              voucherData["@_VCHTYPE"] ||
              "Journal"
            ).toString();
            let rawTypeLower = rawVchType.toLowerCase();
            let effectiveType =
              voucherTypeMap.get(rawTypeLower) || rawTypeLower;

            if (effectiveType.includes("payment")) effectiveType = "payment";
            else if (effectiveType.includes("receipt"))
              effectiveType = "receipt";
            else if (effectiveType.includes("contra")) effectiveType = "contra";
            else if (
              effectiveType.includes("sales") ||
              effectiveType.includes("sale")
            )
              effectiveType = "sales";
            else if (effectiveType.includes("purchase"))
              effectiveType = "purchase";
            else if (
              effectiveType.includes("stock journal") ||
              effectiveType.includes("manufacturing")
            )
              effectiveType = "stock_journal";
            else effectiveType = "journal";

            let vchNoStr = String(
              voucherData.VOUCHERNUMBER ||
                voucherData["@_VOUCHERNUMBER"] ||
                "AUTO-" + Math.floor(Math.random() * 1000000)
            ).trim();
            let vchNoInt = parseInt(vchNoStr);
            if (isNaN(vchNoInt)) vchNoInt = Math.floor(Math.random() * 1000000);

            const date = parseTallyDate(
              voucherData.DATE || voucherData["@_DATE"]
            );
            const narration = String(voucherData.NARRATION || "");
            const transactionCode = Math.floor(
              100000 + Math.random() * 900000
            ).toString();

            let rawLedgers =
              voucherData["ALLLEDGERENTRIES.LIST"] ||
              voucherData["LEDGERENTRIES.LIST"] ||
              [];
            if (!Array.isArray(rawLedgers)) rawLedgers = [rawLedgers];

            const ledgerEntries: any[] = [];
            let totalAmount = 0;

            for (const ent of rawLedgers) {
              const lName = getName(ent);
              if (!lName) continue;
              const amt = -parseTallyNumber(ent.AMOUNT);
              if (amt > 0) totalAmount += amt;

              let ledgerId = ledgerMap.get(lName.toLowerCase());

              // ✅ FIXED: Strictly narrowing ledgerId logic to satisfy build worker
              if (ledgerId === undefined) {
                const fid = await getFallbackId();
                const newL = await prisma.ledger.create({
                  data: { name: lName, companyId, groupId: fid },
                });
                const newCreatedId: number = newL.id; // Guarantee strict number
                ledgerMap.set(lName.toLowerCase(), newCreatedId);
                ledgerId = newCreatedId;
              }
              ledgerEntries.push({ ledgerId: ledgerId as number, amount: amt });
            }

            let rawInv =
              voucherData["ALLINVENTORYENTRIES.LIST"] ||
              voucherData["INVENTORYENTRIES.LIST"] ||
              [];
            if (!Array.isArray(rawInv)) rawInv = [rawInv];

            const inventoryEntries: any[] = [];
            for (const inv of rawInv) {
              const iName = getName(inv);
              if (!iName) continue;

              let itemId = itemMap.get(iName.toLowerCase());
              // ✅ FIXED: Strictly narrowing itemId logic
              if (itemId === undefined) {
                const newItm = await prisma.stockItem.create({
                  data: { name: iName, companyId, gstRate: 0 },
                });
                const newCreatedItemId: number = newItm.id;
                itemMap.set(iName.toLowerCase(), newCreatedItemId);
                itemId = newCreatedItemId;
              }

              const qtyStr = inv.BILLEDQTY || inv.ACTUALQTY || "0";
              const qty = Math.abs(parseTallyNumber(qtyStr));
              const isDeemedPositive =
                inv.ISDEEMEDPOSITIVE === "Yes" ||
                inv["@_ISDEEMEDPOSITIVE"] === "Yes";

              inventoryEntries.push({
                stockItemId: itemId as number,
                quantity: qty,
                rate: Math.abs(parseTallyNumber(inv.RATE)),
                amount: Math.abs(parseTallyNumber(inv.AMOUNT)),
                unit: String(qtyStr).match(/[a-zA-Z]+/)?.[0] || "",
                isDeemedPositive,
              });

              let allocs = inv["ACCOUNTINGALLOCATIONS.LIST"] || [];
              if (!Array.isArray(allocs)) allocs = [allocs];
              for (const al of allocs) {
                const alName = getName(al);
                const alAmt = -parseTallyNumber(al.AMOUNT);
                let alLedgerId = ledgerMap.get(alName.toLowerCase());
                if (alLedgerId === undefined) {
                  const fid = await getFallbackId();
                  const newL = await prisma.ledger.create({
                    data: { name: alName, companyId, groupId: fid },
                  });
                  const newAlId: number = newL.id;
                  ledgerMap.set(alName.toLowerCase(), newAlId);
                  alLedgerId = newAlId;
                }
                ledgerEntries.push({
                  ledgerId: alLedgerId as number,
                  amount: alAmt,
                });
              }
            }

            const cleanInv = inventoryEntries.map(
              ({ isDeemedPositive, ...rest }: any) => rest
            );

            if (effectiveType === "stock_journal") {
              const sjEntries = inventoryEntries.map((e: any) => ({
                stockItemId: e.stockItemId,
                quantity: e.isDeemedPositive ? e.quantity : -e.quantity,
                rate: e.rate,
                amount: e.amount,
                isProduction: e.isDeemedPositive,
              }));
              await prisma.stockJournal.create({
                data: {
                  companyId,
                  voucherNo: vchNoStr,
                  transactionCode,
                  date,
                  narration,
                  status: "APPROVED",
                  createdById: userId,
                  inventoryEntries: { create: sjEntries },
                },
              });
              stats.stockJournal++;
            } else if (effectiveType === "sales") {
              await prisma.salesVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoStr,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                  inventoryEntries: { create: cleanInv },
                },
              });
              stats.sales++;
            } else if (effectiveType === "purchase") {
              await prisma.purchaseVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoStr,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                  inventoryEntries: { create: cleanInv },
                },
              });
              stats.purchase++;
            } else if (effectiveType === "payment") {
              await prisma.paymentVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoInt,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                },
              });
              stats.payment++;
            } else if (effectiveType === "receipt") {
              await prisma.receiptVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoInt,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                },
              });
              stats.receipt++;
            } else if (effectiveType === "contra") {
              await prisma.contraVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoInt,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                },
              });
              stats.contra++;
            } else {
              await prisma.journalVoucher.create({
                data: {
                  companyId,
                  voucherNo: vchNoInt,
                  date,
                  narration,
                  totalAmount,
                  transactionCode,
                  status: "APPROVED",
                  createdById: userId,
                  ledgerEntries: { create: ledgerEntries },
                },
              });
              stats.journal++;
            }
          } catch (err: any) {
            console.error(`Skipping Voucher: ${err.message}`);
            stats.skipped++;
          }
        })
      );
    }

    revalidatePath(`/companies/${companyId}`);
    return {
      success: true,
      message: `Imported Successfully.`,
    };
  } catch (err: any) {
    return { error: `Processing Failed: ${err.message}` };
  }
}

// WRAPPER
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
