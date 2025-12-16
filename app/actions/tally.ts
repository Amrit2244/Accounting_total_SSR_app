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

// ✅ FIX: Robust Date Parser
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

// Helper: Deep search for keys
function findKeyInObject(obj: any, key: string): any {
  if (!obj || typeof obj !== "object") return null;
  if (obj[key]) return obj[key];
  for (const k of Object.keys(obj)) {
    const result = findKeyInObject(obj[k], key);
    if (result) return result;
  }
  return null;
}

// Helper: Get Name safely
function getName(obj: any): string {
  if (!obj) return "";
  if (obj["@_NAME"]) return obj["@_NAME"];
  if (obj.NAME) return Array.isArray(obj.NAME) ? obj.NAME[0] : obj.NAME;
  return "";
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

    text = text.replace(/<[\/]{0,1}[a-zA-Z0-9]+:/g, "<"); // Strip Namespaces

    // 1. Chunking Strategy (Finds everything)
    let rawChunks = text.match(/<TALLYMESSAGE[\s\S]*?<\/TALLYMESSAGE>/gi) || [];

    if (rawChunks.length === 0) {
      // Fallback for direct tags
      const allTags =
        text.match(
          /<(GROUP|LEDGER|UNIT|STOCKGROUP|STOCKITEM|VOUCHER)[\s\S]*?<\/\1>/gi
        ) || [];
      rawChunks = allTags;
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
    let logs: string[] = [];

    for (const rawMsg of rawChunks) {
      const safeXML = rawMsg.startsWith("<")
        ? rawMsg
        : `<ROOT>${rawMsg}</ROOT>`;
      const jsonObj = parser.parse(safeXML);
      const data = jsonObj.TALLYMESSAGE || jsonObj;

      // Extract objects
      const groupData = findKeyInObject(data, "GROUP");
      const ledgerData = findKeyInObject(data, "LEDGER");
      const unitData = findKeyInObject(data, "UNIT");
      const stockGroupData = findKeyInObject(data, "STOCKGROUP");
      const stockItemData = findKeyInObject(data, "STOCKITEM");
      const voucherData = findKeyInObject(data, "VOUCHER");

      // ---------------------
      // 1. ACCOUNTING GROUPS
      // ---------------------
      if (groupData) {
        const name = getName(groupData);
        if (name && name !== "Primary") {
          const existing = await prisma.group.findFirst({
            where: { name, companyId },
          });
          if (!existing) {
            await prisma.group.create({ data: { name, companyId } });
            stats.groups++;
          }
        }
      }

      // ---------------------
      // 2. LEDGERS
      // ---------------------
      else if (ledgerData) {
        const name = getName(ledgerData);
        if (name) {
          let parentName = ledgerData["@_PARENT"] || ledgerData.PARENT;
          if (Array.isArray(parentName)) parentName = parentName[0];

          let groupId = null;
          if (parentName) {
            const g = await prisma.group.findFirst({
              where: { name: parentName, companyId },
            });
            if (g) groupId = g.id;
          }
          if (!groupId) groupId = await getFallbackGroupId(companyId);

          let opVal =
            ledgerData["@_OPENINGBALANCE"] || ledgerData.OPENINGBALANCE || "0";
          if (Array.isArray(opVal)) opVal = opVal[0];
          const opBalance = parseFloat(opVal);

          const existing = await prisma.ledger.findFirst({
            where: { name, companyId },
          });
          if (!existing) {
            await prisma.ledger.create({
              data: { name, groupId, companyId, openingBalance: opBalance },
            });
            stats.ledgers++;
          }
        }
      }

      // ---------------------
      // 3. UNITS
      // ---------------------
      else if (unitData) {
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
      }

      // ---------------------
      // 4. STOCK GROUPS
      // ---------------------
      else if (stockGroupData) {
        const name = getName(stockGroupData);
        if (name && name !== "Primary") {
          const existing = await prisma.stockGroup.findFirst({
            where: { name, companyId },
          });
          if (!existing) {
            // Find Parent if exists
            let parentId = null;
            let parentName = stockGroupData.PARENT;
            if (parentName && parentName !== "Primary") {
              const pGroup = await prisma.stockGroup.findFirst({
                where: { name: parentName, companyId },
              });
              if (pGroup) parentId = pGroup.id;
            }

            await prisma.stockGroup.create({
              data: { name, companyId, parentId },
            });
            stats.stockGroups++;
          }
        }
      }

      // ---------------------
      // 5. STOCK ITEMS
      // ---------------------
      else if (stockItemData) {
        const name = getName(stockItemData);
        if (name) {
          const existing = await prisma.stockItem.findFirst({
            where: { name, companyId },
          });

          if (!existing) {
            // Resolve Group
            let groupId = null;
            let parentName = stockItemData.PARENT;
            if (parentName && parentName !== "Primary") {
              const g = await prisma.stockGroup.findFirst({
                where: { name: parentName, companyId },
              });
              if (g) groupId = g.id;
            }

            // Resolve Unit
            let unitId = null;
            let unitName = stockItemData.BASEUNITS;
            if (unitName) {
              const u = await prisma.unit.findFirst({
                where: { symbol: unitName, companyId },
              });
              if (u) unitId = u.id;
            }

            await prisma.stockItem.create({
              data: {
                name,
                companyId,
                groupId,
                unitId,
                gstRate: 0,
              },
            });
            stats.stockItems++;
          }
        }
      }

      // ---------------------
      // 6. VOUCHERS (Restored Full Logic)
      // ---------------------
      else if (voucherData) {
        const dateStr = voucherData["@_DATE"] || voucherData.DATE;
        let vchNo = voucherData["@_VOUCHERNUMBER"] || voucherData.VOUCHERNUMBER;
        vchNo = vchNo ? String(vchNo) : "No-Number";

        const rawType = (
          voucherData["@_VOUCHERTYPENAME"] ||
          voucherData.VOUCHERTYPENAME ||
          ""
        ).toString();

        if (dateStr) {
          const date = parseTallyDate(dateStr);
          const finalVchNo =
            vchNo === "No-Number"
              ? "Auto-" + Math.random().toString().substring(2, 8)
              : vchNo;

          let dbType = "JOURNAL";
          const lowerType = rawType.toLowerCase();
          if (lowerType.includes("payment")) dbType = "PAYMENT";
          else if (lowerType.includes("receipt")) dbType = "RECEIPT";
          else if (lowerType.includes("sales")) dbType = "SALES";
          else if (lowerType.includes("purchase")) dbType = "PURCHASE";
          else if (lowerType.includes("contra")) dbType = "CONTRA";

          const exists = await prisma.voucher.findFirst({
            where: { voucherNo: finalVchNo, companyId, type: dbType as any },
          });

          if (!exists) {
            const newVoucher = await prisma.voucher.create({
              data: {
                date,
                voucherNo: finalVchNo,
                type: dbType as any,
                transactionCode: Math.floor(
                  10000 + Math.random() * 90000
                ).toString(),
                companyId,
                createdById: userId,
                status: "APPROVED",
                narration: (voucherData.NARRATION || "").substring(0, 190),
              },
            });

            let entries =
              voucherData["ALLLEDGERENTRIES.LIST"] ||
              voucherData["LEDGERENTRIES.LIST"];
            if (entries) {
              if (!Array.isArray(entries)) entries = [entries];

              for (const entry of entries) {
                const ledgerName = getName(entry) || entry.LEDGERNAME;
                if (!ledgerName) continue;

                const amount = parseFloat(
                  entry.AMOUNT || entry["@_AMOUNT"] || "0"
                );
                let ledger = await prisma.ledger.findFirst({
                  where: { name: ledgerName, companyId },
                });

                if (!ledger) {
                  const fallbackId = await getFallbackGroupId(companyId);
                  ledger = await prisma.ledger.create({
                    data: {
                      name: ledgerName,
                      groupId: fallbackId,
                      companyId,
                      openingBalance: 0,
                    },
                  });
                }

                await prisma.voucherEntry.create({
                  data: {
                    voucherId: newVoucher.id,
                    ledgerId: ledger.id,
                    amount,
                  },
                });
              }
            }
            stats.vouchers++;
          }
        }
      }
    }

    revalidatePath(`/companies/${companyId}`);

    return {
      success: true,
      message: `Imported: ${stats.groups} Groups, ${stats.ledgers} Ledgers, ${stats.units} Units, ${stats.stockGroups} StkGroups, ${stats.stockItems} Items, ${stats.vouchers} Vouchers.`,
    };
  } catch (err: any) {
    console.error("Import Error:", err.message);
    return { error: `Processing Failed: ${err.message}` };
  }
}
