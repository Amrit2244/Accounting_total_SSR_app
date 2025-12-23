"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const BATCH_SIZE = 50;
const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

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

// ✅ HELPER: Extract Inventory
function extractInventoryFromVoucher(v: any): any[] {
  let items: any[] = [];
  const asArray = (x: any) => (Array.isArray(x) ? x : [x]);

  // 1. Top-Level
  if (v["ALLINVENTORYENTRIES.LIST"])
    items.push(...asArray(v["ALLINVENTORYENTRIES.LIST"]));
  if (v["INVENTORYENTRIES.LIST"])
    items.push(...asArray(v["INVENTORYENTRIES.LIST"]));

  // 2. Nested inside Ledgers
  let leds = v["ALLLEDGERENTRIES.LIST"] || v["LEDGERENTRIES.LIST"];
  if (leds) {
    leds = asArray(leds);
    for (const led of leds) {
      if (led["INVENTORYENTRIES.LIST"])
        items.push(...asArray(led["INVENTORYENTRIES.LIST"]));
      if (led["ALLINVENTORYENTRIES.LIST"])
        items.push(...asArray(led["ALLINVENTORYENTRIES.LIST"]));
    }
  }
  return items;
}

export async function processTallyXML(
  xmlContent: string,
  companyId: number,
  userId: number
) {
  try {
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
      ledgers: 0,
      groups: 0,
      stockItems: 0,
      stockGroups: 0,
      units: 0,
      sales: 0,
      purchase: 0,
      payment: 0,
      receipt: 0,
      contra: 0,
      journal: 0,
      skipped: 0,
    };

    // --- DB CACHE ---
    const groupMap = new Map<string, number>(
      (
        await prisma.group.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((g: any) => [g.name.toLowerCase(), g.id])
    );
    const ledgerMap = new Map<string, number>(
      (
        await prisma.ledger.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((l: any) => [l.name.toLowerCase(), l.id])
    );
    const stockGroupMap = new Map<string, number>(
      (
        await prisma.stockGroup.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((g: any) => [g.name.toLowerCase(), g.id])
    );
    const itemMap = new Map<string, number>(
      (
        await prisma.stockItem.findMany({
          where: { companyId },
          select: { name: true, id: true },
        })
      ).map((i: any) => [i.name.toLowerCase(), i.id])
    );
    const unitMap = new Map<string, number>(
      (
        await prisma.unit.findMany({
          where: { companyId },
          select: { symbol: true, id: true },
        })
      ).map((u: any) => [u.symbol.toLowerCase(), u.id])
    );

    const getPrimaryGroupId = async () => {
      const ex = groupMap.get("primary");
      if (ex !== undefined) return ex;
      const g = await prisma.group.create({
        data: { name: "Primary", companyId },
      });
      groupMap.set("primary", g.id);
      return g.id;
    };

    const getFallbackId = async () => {
      const ex = groupMap.get("suspense account");
      if (ex !== undefined) return ex;
      const g = await prisma.group.create({
        data: { name: "Suspense Account", companyId },
      });
      groupMap.set("suspense account", g.id);
      return g.id;
    };

    const masters = {
      groups: [] as any[],
      ledgers: [] as any[],
      stockGroups: [] as any[],
      stockItems: [] as any[],
      units: [] as any[],
      vouchers: [] as any[],
    };

    for (const rawMsg of rawChunks) {
      const jsonObj = parser.parse(
        rawMsg.startsWith("<") ? rawMsg : `<ROOT>${rawMsg}</ROOT>`
      );
      const data = jsonObj.TALLYMESSAGE || jsonObj;

      if (data.GROUP) masters.groups.push(data.GROUP);
      if (data.LEDGER) masters.ledgers.push(data.LEDGER);
      if (data.STOCKGROUP) masters.stockGroups.push(data.STOCKGROUP);
      if (data.STOCKITEM) masters.stockItems.push(data.STOCKITEM);
      if (data.UNIT) masters.units.push(data.UNIT);
      if (data.VOUCHER) masters.vouchers.push(data.VOUCHER);
    }

    // --- 1. PROCESS MASTERS ---
    for (const g of masters.groups) {
      const name = getName(g);
      if (name && !groupMap.has(name.toLowerCase())) {
        const ng = await prisma.group.create({ data: { name, companyId } });
        groupMap.set(name.toLowerCase(), ng.id);
        stats.groups++;
      }
    }
    for (const sg of masters.stockGroups) {
      const name = getName(sg);
      if (name && !stockGroupMap.has(name.toLowerCase())) {
        const nsg = await prisma.stockGroup.create({
          data: { name, companyId },
        });
        stockGroupMap.set(name.toLowerCase(), nsg.id);
        stats.stockGroups++;
      }
    }
    for (const u of masters.units) {
      const symbol = u.ORIGINALNAME || u.NAME || getName(u);
      if (symbol && !unitMap.has(String(symbol).toLowerCase())) {
        const nu = await prisma.unit.create({
          data: { name: String(symbol), symbol: String(symbol), companyId },
        });
        unitMap.set(String(symbol).toLowerCase(), nu.id);
        stats.units++;
      }
    }
    for (const led of masters.ledgers) {
      const name = getName(led);
      if (name && !ledgerMap.has(name.toLowerCase())) {
        let gid: number | undefined;
        const parentName = led.PARENT || led["@_PARENT"];
        if (parentName && typeof parentName === "string") {
          const pNameLower = parentName.trim().toLowerCase();
          gid = groupMap.get(pNameLower);
          if (gid === undefined && pNameLower) {
            const newGroup = await prisma.group.create({
              data: { name: parentName, companyId },
            });
            gid = newGroup.id;
            groupMap.set(pNameLower, gid);
            stats.groups++;
          }
        }
        if (name.toLowerCase().includes("profit & loss"))
          gid = await getPrimaryGroupId();
        if (gid === undefined) gid = await getFallbackId();

        const nl = await prisma.ledger.create({
          data: {
            name,
            companyId,
            groupId: gid,
            openingBalance: parseTallyNumber(led.OPENINGBALANCE),
          },
        });
        ledgerMap.set(name.toLowerCase(), nl.id);
        stats.ledgers++;
      }
    }
    for (const itm of masters.stockItems) {
      const name = getName(itm);
      if (name && !itemMap.has(name.toLowerCase())) {
        const pName = String(itm["@_PARENT"] || itm.PARENT || "").toLowerCase();
        let sgid = pName ? stockGroupMap.get(pName) : null;
        let uid = itm.BASEUNITS
          ? unitMap.get(String(itm.BASEUNITS).toLowerCase())
          : null;
        const ni = await prisma.stockItem.create({
          data: {
            name,
            companyId,
            groupId: sgid ?? null,
            unitId: uid ?? null,
            quantity: parseTallyNumber(itm.OPENINGBALANCE),
            gstRate: 0,
          },
        });
        itemMap.set(name.toLowerCase(), ni.id);
        stats.stockItems++;
      }
    }

    // --- 2. PROCESS VOUCHERS ---
    const rawVouchers = masters.vouchers;

    for (let i = 0; i < rawVouchers.length; i += BATCH_SIZE) {
      const batch = rawVouchers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (v: any) => {
          try {
            let eff = (v.VOUCHERTYPENAME || v["@_VCHTYPE"] || "Journal")
              .toString()
              .toLowerCase();
            if (eff.includes("payment")) eff = "payment";
            else if (eff.includes("receipt")) eff = "receipt";
            else if (eff.includes("contra")) eff = "contra";
            else if (eff.includes("sale")) eff = "sales";
            else if (eff.includes("purchase")) eff = "purchase";
            else eff = "journal";

            const date = parseTallyDate(v.DATE || v["@_DATE"]);
            const txCode = Math.floor(10000 + Math.random() * 89999).toString();
            const rawVNo = String(
              v.VOUCHERNUMBER || v["@_VOUCHERNUMBER"] || txCode
            );

            // A. Ledgers
            let rawLeds =
              v["ALLLEDGERENTRIES.LIST"] || v["LEDGERENTRIES.LIST"] || [];
            if (!Array.isArray(rawLeds)) rawLeds = [rawLeds];
            const ledgerEntries: any[] = [];
            let totalAmount = 0;

            for (const ent of rawLeds) {
              const lName = getName(ent);
              if (!lName) continue;
              const amt = parseTallyNumber(ent.AMOUNT);
              if (amt < 0) totalAmount += Math.abs(amt);

              let lid = ledgerMap.get(lName.toLowerCase());
              if (lid === undefined) {
                const fid = await getFallbackId();
                const nl = await prisma.ledger.create({
                  data: { name: lName, companyId, groupId: fid },
                });
                lid = nl.id;
                ledgerMap.set(lName.toLowerCase(), lid);
                stats.ledgers++;
              }
              ledgerEntries.push({ ledgerId: lid, amount: amt });
            }

            // B. Inventory (With Master Creation)
            const rawInv = extractInventoryFromVoucher(v);
            const inventoryEntries: any[] = [];

            for (const item of rawInv) {
              const itemName = getName(item);
              if (!itemName) continue;

              let itemId = itemMap.get(itemName.toLowerCase());
              if (!itemId) {
                const ni = await prisma.stockItem.create({
                  data: { name: itemName, companyId, quantity: 0, gstRate: 0 },
                });
                itemId = ni.id;
                itemMap.set(itemName.toLowerCase(), itemId);
                stats.stockItems++;
              }

              const qty = parseTallyNumber(item.ACTUALQTY || item.BILLEDQTY);
              const rateStr = String(item.RATE || "0").split("/")[0];
              const rate = parseTallyNumber(rateStr);
              const amt = parseTallyNumber(item.AMOUNT);

              inventoryEntries.push({
                stockItemId: itemId,
                quantity: qty,
                rate: rate,
                amount: amt,
                unit: "",
              });
            }

            // C. Save to DB (Conditional Inventory)
            const commonData = {
              companyId,
              date,
              narration: String(v.NARRATION || ""),
              totalAmount,
              transactionCode: txCode,
              status: "APPROVED",
              createdById: userId,
              ledgerEntries: { create: ledgerEntries },
            };

            const saveVoucher = async (
              db: any,
              vNumber: any,
              isInt: boolean = false,
              withInventory: boolean = false
            ) => {
              const dataToSave = withInventory
                ? {
                    ...commonData,
                    inventoryEntries: { create: inventoryEntries },
                    voucherNo: vNumber,
                  }
                : { ...commonData, voucherNo: vNumber };

              try {
                return await db.create({ data: dataToSave });
              } catch (e: any) {
                if (e.code === "P2002") {
                  const newVno = isInt
                    ? Math.floor(Math.random() * 1000000)
                    : `${vNumber}-${Math.random().toString(36).substring(7)}`;
                  const newData = { ...dataToSave, voucherNo: newVno };
                  return await db.create({ data: newData });
                }
                throw e;
              }
            };

            if (eff === "sales") {
              await saveVoucher(prisma.salesVoucher, rawVNo, false, true); // ✅ Has Inventory
            } else if (eff === "purchase") {
              await saveVoucher(prisma.purchaseVoucher, rawVNo, false, true); // ✅ Has Inventory
            } else {
              const cleanInt =
                parseInt(rawVNo.replace(/\D/g, "")) || parseInt(txCode);
              if (eff === "payment")
                await saveVoucher(prisma.paymentVoucher, cleanInt, true, false);
              // ❌ No Inventory
              else if (eff === "receipt")
                await saveVoucher(prisma.receiptVoucher, cleanInt, true, false);
              // ❌ No Inventory
              else if (eff === "contra")
                await saveVoucher(prisma.contraVoucher, cleanInt, true, false);
              // ❌ No Inventory
              else
                await saveVoucher(prisma.journalVoucher, cleanInt, true, false); // ❌ No Inventory
            }
            stats[eff as keyof typeof stats]++;
          } catch (err) {
            stats.skipped++;
          }
        })
      );
    }

    revalidatePath(`/companies/${companyId}/vouchers`);
    return {
      success: true,
      message: `Import Summary:
      Masters: ${stats.ledgers} Ledgers, ${stats.groups} Groups, ${stats.stockItems} Items.
      Vouchers: ${stats.sales} Sales, ${stats.purchase} Purchase, ${stats.payment} Payment, ${stats.receipt} Receipt.
      (Errors/Skipped: ${stats.skipped})`,
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function importTallyXML(prevState: any, formData: FormData) {
  const file = formData.get("xmlFile") as File;
  const companyId = parseInt(formData.get("companyId") as string);
  const userId = await getCurrentUserId();
  if (!userId || !file) return { error: "Unauthorized or no file" };
  const buffer = await file.arrayBuffer();
  const buf = Buffer.from(buffer);
  let text = buf.toString("utf-8");
  if (text.includes("\u0000")) text = buf.toString("utf16le");
  return await processTallyXML(text, companyId, userId);
}
