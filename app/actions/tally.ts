"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const TALLY_URL = process.env.TALLY_URL || "http://localhost:9000";
const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

// --- HELPERS ---

function getVal(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string" || typeof obj === "number")
    return String(obj).trim();
  return String(obj._text || obj["#text"] || "").trim();
}

function ensureArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
}

function generateTXID(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Robust Date Formatter to prevent RangeError
function formatTallyDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split("T")[0].replace(/-/g, "");
  }
  return d.toISOString().split("T")[0].replace(/-/g, "");
}

export async function getCurrentUserId(): Promise<number | null> {
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

// --- 1. MASTER IMPORT (FIXED ROOT CAUSE: Dr/Cr Signs) ---
export async function syncLocalTally(companyId: number, userId: number) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: "_text",
  });
  try {
    const ledXml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>LedSync</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES><TDL><TDLMESSAGE><COLLECTION NAME="LedSync"><TYPE>Ledger</TYPE><FETCH>NAME, PARENT, OPENINGBALANCE</FETCH></COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;
    const response = await fetch(TALLY_URL, { method: "POST", body: ledXml });
    const jsonObj = parser.parse(await response.text());
    const ledgers = ensureArray(
      jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER
    );

    for (const l of ledgers) {
      const parent = getVal(l.PARENT) || "Primary";

      /**
       * ROOT FIX: Tally XML exports Debit balances as negative numbers.
       * We removed the "* -1" to store the data exactly as Tally intended.
       * Negative = Debit (Dr), Positive = Credit (Cr).
       */
      const opBal = parseFloat(getVal(l.OPENINGBALANCE)) || 0.0;

      const grp = await prisma.group.upsert({
        where: { name_companyId: { name: parent, companyId } },
        update: {},
        create: { name: parent, companyId },
      });

      await prisma.ledger.upsert({
        where: {
          name_companyId: { name: getVal(l.NAME || l["@_NAME"]), companyId },
        },
        update: { groupId: grp.id, openingBalance: opBal },
        create: {
          name: getVal(l.NAME || l["@_NAME"]),
          companyId,
          groupId: grp.id,
          openingBalance: opBal,
        },
      });
    }
    revalidatePath(`/companies/${companyId}/chart-of-accounts`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- 2. VOUCHER LIST (USE MASTERID TO PREVENT OVERWRITING) ---
export async function getVoucherList(
  companyId: number,
  fromDate: string,
  toDate: string,
  type: string
) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const tFrom = formatTallyDate(fromDate);
  const tTo = formatTallyDate(toDate);

  const xml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>VList</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVFROMDATE>${tFrom}</SVFROMDATE><SVTODATE>${tTo}</SVTODATE></STATICVARIABLES><TDL><TDLMESSAGE><COLLECTION NAME="VList"><TYPE>Voucher</TYPE><FETCH>MASTERID, VOUCHERTYPENAME</FETCH></COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;

  try {
    const res = await fetch(TALLY_URL, { method: "POST", body: xml });
    const jsonObj = parser.parse(await res.text());
    const vouchers = ensureArray(
      jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER
    );

    return vouchers
      .filter((v) =>
        getVal(v.VOUCHERTYPENAME).toLowerCase().includes(type.toLowerCase())
      )
      .map((v) => getVal(v.MASTERID || v["@_MASTERID"])); // Return Unique Master IDs
  } catch (e) {
    return [];
  }
}

// --- 3. SINGLE VOUCHER SYNC (BY MASTER ID) ---
export async function syncSingleVoucher(
  companyId: number,
  masterId: string,
  expectedType?: string
) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: "_text",
  });
  const filterFormula = `$MasterId = ${masterId}`;

  const xml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>SV</ID></HEADER><BODY><DESC><TDL><TDLMESSAGE><COLLECTION NAME="SV"><TYPE>Voucher</TYPE><FILTER>IdFilter</FILTER><FETCH>VOUCHERNUMBER, MASTERID, DATE, PARTYLEDGERNAME, VOUCHERTYPENAME, NARRATION, AMOUNT</FETCH><FETCH>LEDGERENTRIES.*</FETCH><FETCH>ALLLEDGERENTRIES.*</FETCH><FETCH>INVENTORYENTRIES.*</FETCH><FETCH>ALLINVENTORYENTRIES.*</FETCH></COLLECTION><SYSTEM TYPE="Formula" NAME="IdFilter">${filterFormula}</SYSTEM></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;

  try {
    const res = await fetch(TALLY_URL, { method: "POST", body: xml });
    const jsonObj = parser.parse(await res.text());
    const v = ensureArray(
      jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER
    )[0];

    if (!v) return false;

    const vTypeName = getVal(v.VOUCHERTYPENAME).toUpperCase();
    const vDateStr = getVal(v.DATE);
    const vDate = new Date(
      `${vDateStr.substring(0, 4)}-${vDateStr.substring(
        4,
        6
      )}-${vDateStr.substring(6, 8)}`
    );
    const partyName = getVal(v.PARTYLEDGERNAME).replace(/\s+/g, " ").trim();
    const narration = getVal(v.NARRATION) || "";

    const vNumProcessed = parseInt(masterId, 10);

    let primaryLedgerList = ensureArray(v["ALLLEDGERENTRIES.LIST"]);
    if (primaryLedgerList.length === 0)
      primaryLedgerList = ensureArray(v["LEDGERENTRIES.LIST"]);

    const allInventoryLists = [
      ...ensureArray(v["INVENTORYENTRIES.LIST"]),
      ...ensureArray(v["ALLINVENTORYENTRIES.LIST"]),
    ];

    const finalLedgerList = [];
    let calculatedTotal = 0;

    for (const l of primaryLedgerList) {
      const lName = getVal(l.LEDGERNAME || l.NAME)
        .replace(/\s+/g, " ")
        .trim();

      /**
       * ROOT FIX: Maintain the Tally Sign.
       * Tally: Negative = Debit, Positive = Credit.
       */
      const lAmt = parseFloat(getVal(l.AMOUNT)) || 0;

      if (lName && Math.abs(lAmt) > 0) {
        finalLedgerList.push({ name: lName, amount: lAmt });
        // We calculate total based on Debits (Negative numbers in Tally)
        if (lAmt < 0) calculatedTotal += Math.abs(lAmt);
      }
    }

    const finalTotalAmount =
      Math.abs(parseFloat(getVal(v.AMOUNT)) || 0) || calculatedTotal;

    return await prisma.$transaction(
      async (tx) => {
        let dbVoucher: any;
        let ledgerTx: any;
        let inventoryTx: any;
        let parentIdKey: string = "";

        const baseData = {
          voucherNo: vNumProcessed,
          transactionCode: generateTXID(),
          date: vDate,
          companyId,
          createdById: 1,
          status: "APPROVED",
          totalAmount: finalTotalAmount,
          narration: narration + ` (Vch No: ${getVal(v.VOUCHERNUMBER)})`,
        };

        const whereClause = {
          companyId_voucherNo: { companyId, voucherNo: vNumProcessed },
        };

        if (vTypeName.includes("SALES")) {
          dbVoucher = await tx.salesVoucher.upsert({
            where: whereClause,
            update: { ...baseData, partyName },
            create: { ...baseData, partyName },
          });
          ledgerTx = tx.salesLedgerEntry;
          inventoryTx = tx.salesInventoryEntry;
          parentIdKey = "salesId";
        } else if (vTypeName.includes("PURCHASE")) {
          dbVoucher = await tx.purchaseVoucher.upsert({
            where: whereClause,
            update: { ...baseData, partyName },
            create: { ...baseData, partyName },
          });
          ledgerTx = tx.purchaseLedgerEntry;
          inventoryTx = tx.purchaseInventoryEntry;
          parentIdKey = "purchaseId";
        } else if (vTypeName.includes("PAYMENT")) {
          dbVoucher = await tx.paymentVoucher.upsert({
            where: whereClause,
            update: baseData,
            create: baseData,
          });
          ledgerTx = tx.paymentLedgerEntry;
          parentIdKey = "paymentId";
        } else if (vTypeName.includes("RECEIPT")) {
          dbVoucher = await tx.receiptVoucher.upsert({
            where: whereClause,
            update: baseData,
            create: baseData,
          });
          ledgerTx = tx.receiptLedgerEntry;
          parentIdKey = "receiptId";
        } else if (vTypeName.includes("CONTRA")) {
          dbVoucher = await tx.contraVoucher.upsert({
            where: whereClause,
            update: baseData,
            create: baseData,
          });
          ledgerTx = tx.contraLedgerEntry;
          parentIdKey = "contraId";
        } else if (vTypeName.includes("JOURNAL")) {
          dbVoucher = await tx.journalVoucher.upsert({
            where: whereClause,
            update: baseData,
            create: baseData,
          });
          ledgerTx = tx.journalLedgerEntry;
          parentIdKey = "journalId";
        }

        if (!dbVoucher || !ledgerTx) return false;

        await ledgerTx.deleteMany({ where: { [parentIdKey]: dbVoucher.id } });
        if (inventoryTx)
          await inventoryTx.deleteMany({
            where: { [parentIdKey]: dbVoucher.id },
          });

        for (const l of finalLedgerList) {
          const ledRec = await tx.ledger.upsert({
            where: { name_companyId: { name: l.name, companyId } },
            update: {},
            create: { name: l.name, companyId },
          });
          await ledgerTx.create({
            data: {
              [parentIdKey]: dbVoucher.id,
              ledgerId: ledRec.id,
              amount: l.amount,
            },
          });
        }

        if (inventoryTx) {
          for (const item of allInventoryLists) {
            const itemName = getVal(item.STOCKITEMNAME)
              .replace(/\s+/g, " ")
              .trim();
            if (!itemName) continue;
            const stockItem = await tx.stockItem.upsert({
              where: { name_companyId: { name: itemName, companyId } },
              update: {},
              create: { name: itemName, companyId },
            });
            await inventoryTx.create({
              data: {
                [parentIdKey]: dbVoucher.id,
                stockItemId: stockItem.id,
                quantity: parseFloat(getVal(item.BILLEDQTY)) || 0,
                rate: parseFloat(getVal(item.RATE)) || 0,
                amount: parseFloat(getVal(item.AMOUNT)) || 0,
                unit: getVal(item.BILLEDQTY).match(/[a-zA-Z]+/)?.[0] || "",
              },
            });
          }
        }
        return true;
      },
      { maxWait: 5000, timeout: 20000 }
    );
  } catch (e) {
    console.error(`Error syncing voucher ${masterId}:`, e);
    return false;
  }
}
