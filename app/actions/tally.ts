"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";

const TALLY_URL = "http://localhost:9000";

function getVal(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string" || typeof obj === "number")
    return String(obj).trim();
  return String(obj._text || obj["#text"] || "").trim();
}

function generateTXID(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// --- 1. MASTER SYNC ---
export async function syncLocalTally(companyId: number, userId: number) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: "_text",
  });
  try {
    const ledXml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>LedSync</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES><TDL><TDLMESSAGE><COLLECTION NAME="LedSync"><TYPE>Ledger</TYPE><FETCH>NAME, PARENT</FETCH></COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;
    const response = await fetch(TALLY_URL, { method: "POST", body: ledXml });
    const jsonObj = parser.parse(await response.text());
    const ledgers = [jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER]
      .flat()
      .filter(Boolean);

    for (const l of ledgers) {
      const parent = getVal(l.PARENT) || "Primary";
      const grp = await prisma.group.upsert({
        where: { name_companyId: { name: parent, companyId } },
        update: {},
        create: { name: parent, companyId, nature: "Primary" },
      });
      await prisma.ledger.upsert({
        where: {
          name_companyId: { name: getVal(l.NAME || l["@_NAME"]), companyId },
        },
        update: { groupId: grp.id },
        create: {
          name: getVal(l.NAME || l["@_NAME"]),
          companyId,
          groupId: grp.id,
        },
      });
    }
    return { success: true, message: "Masters synced successfully." };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- 2. GENERIC VOUCHER LIST ---
export async function getVoucherList(
  companyId: number,
  fromDate: string,
  toDate: string,
  type: string
) {
  const parser = new XMLParser({ ignoreAttributes: false, maxSize: 104857600 });
  const xml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>VList</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVFROMDATE>${fromDate}</SVFROMDATE><SVTODATE>${toDate}</SVTODATE></STATICVARIABLES><TDL><TDLMESSAGE><COLLECTION NAME="VList"><TYPE>Voucher</TYPE><FETCH>VOUCHERNUMBER, VOUCHERTYPENAME</FETCH></COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;
  try {
    const res = await fetch(TALLY_URL, { method: "POST", body: xml });
    const jsonObj = parser.parse(await res.text());
    const vouchers = [jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER]
      .flat()
      .filter(Boolean);

    return vouchers
      .filter((v) =>
        getVal(v.VOUCHERTYPENAME).toLowerCase().includes(type.toLowerCase())
      )
      .map((v) => getVal(v.VOUCHERNUMBER || v["@_VOUCHERNUMBER"]));
  } catch (e) {
    return [];
  }
}

// --- 3. UNIVERSAL VOUCHER SYNC (WITH NARRATION SUPPORT) ---
export async function syncSingleVoucher(companyId: number, vNum: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: "_text",
  });
  // Fetching NARRATION explicitly from Tally
  const xml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>SV</ID></HEADER><BODY><DESC><TDL><TDLMESSAGE><COLLECTION NAME="SV"><TYPE>Voucher</TYPE><FILTER>NumFilter</FILTER><FETCH>VOUCHERNUMBER, DATE, PARTYLEDGERNAME, VOUCHERTYPENAME, NARRATION, AMOUNT, LEDGERENTRIES.*, ALLLEDGERENTRIES.*</FETCH></COLLECTION><SYSTEM TYPE="Formula" NAME="NumFilter">$VoucherNumber = "${vNum}"</SYSTEM></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>`;

  try {
    const res = await fetch(TALLY_URL, { method: "POST", body: xml });
    const jsonObj = parser.parse(await res.text());
    const v = [jsonObj?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER]
      .flat()
      .filter(Boolean)[0];
    if (!v) return false;

    const vTypeName = getVal(v.VOUCHERTYPENAME).toUpperCase();
    const vDateStr = getVal(v.DATE);
    const vDate = new Date(
      `${vDateStr.substring(0, 4)}-${vDateStr.substring(
        4,
        6
      )}-${vDateStr.substring(6, 8)}`
    );
    const totalAmount = Math.abs(parseFloat(getVal(v.AMOUNT)) || 0);
    const partyName = getVal(v.PARTYLEDGERNAME).replace(/\s+/g, " ").trim();

    // EXTRACT NARRATION
    const narration = getVal(v.NARRATION) || "";

    return await prisma.$transaction(async (tx) => {
      let dbVoucher: any;
      let ledgerTx: any;
      let parentIdKey: string = "";

      // Convert Voucher Number to Int or String based on your Schema logic
      // Note: In your schema, Sales/Purchase use String, others use Int.
      const vNumProcessed: any =
        vTypeName.includes("SALES") ||
        vTypeName.includes("PURCHASE") ||
        vTypeName.includes("STOCK")
          ? String(vNum)
          : parseInt(vNum, 10);

      const whereClause = {
        companyId_voucherNo: { companyId, voucherNo: vNumProcessed },
      };

      const baseData = {
        voucherNo: vNumProcessed,
        transactionCode: generateTXID(),
        date: vDate,
        companyId,
        createdById: 1,
        status: "APPROVED",
        totalAmount,
        narration, // <--- SAVING NARRATION HERE
      };

      // ROUTE TO CORRECT TABLE
      if (vTypeName.includes("SALES")) {
        dbVoucher = await tx.salesVoucher.upsert({
          where: whereClause,
          update: { ...baseData, partyName },
          create: { ...baseData, partyName },
        });
        ledgerTx = tx.salesLedgerEntry;
        parentIdKey = "salesId";
      } else if (vTypeName.includes("PURCHASE")) {
        dbVoucher = await tx.purchaseVoucher.upsert({
          where: whereClause,
          update: { ...baseData, partyName },
          create: { ...baseData, partyName },
        });
        ledgerTx = tx.purchaseLedgerEntry;
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

      const ledgersRaw = [v["LEDGERENTRIES.LIST"], v["ALLLEDGERENTRIES.LIST"]]
        .flat()
        .filter(Boolean);

      for (const l of ledgersRaw) {
        const lName = getVal(l.LEDGERNAME).replace(/\s+/g, " ").trim();
        const lAmt = parseFloat(getVal(l.AMOUNT)) || 0;

        let ledRec = await tx.ledger.findUnique({
          where: { name_companyId: { name: lName, companyId } },
        });
        if (!ledRec) {
          ledRec = await tx.ledger.create({
            data: { name: lName, companyId, nature: "Primary" },
          });
        }

        if (ledRec && Math.abs(lAmt) > 0) {
          await ledgerTx.create({
            data: {
              [parentIdKey]: dbVoucher.id,
              ledgerId: ledRec.id,
              amount: lAmt,
            },
          });
        }
      }
      return true;
    });
  } catch (e) {
    console.error("Database Sync Error:", e);
    return false;
  }
}
