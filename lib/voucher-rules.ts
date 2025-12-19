import { prisma } from "./prisma";

// Helper to check if a ledger is Cash or Bank
export async function getLedgerNature(ledgerId: number) {
  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    include: { group: true },
  });

  if (!ledger) return "OTHER";

  // ✅ FIX: Use optional chaining and nullish coalescing
  // Since ledger.group could be null, we handle it safely
  const groupName = ledger.group?.name || "";
  const tallyName = ledger.tallyName;

  if (tallyName === "Cash" || groupName === "Cash-in-hand") return "CASH";
  if (tallyName === "Bank" || groupName === "Bank Accounts") return "BANK";

  return "OTHER";
}

export async function validateVoucherRules(
  type: string,
  entries: { ledgerId: string; type: string }[]
) {
  for (const entry of entries) {
    const nature = await getLedgerNature(parseInt(entry.ledgerId));
    const isDr = entry.type === "Dr";
    const isCr = entry.type === "Cr";

    // 1. CONTRA: Only Cash/Bank allowed everywhere
    if (type === "CONTRA") {
      if (nature !== "CASH" && nature !== "BANK") {
        return "Contra Vouchers allow only Cash and Bank ledgers.";
      }
    }

    // 2. PAYMENT: Credit must be Cash/Bank
    if (type === "PAYMENT") {
      if (isCr && nature !== "CASH" && nature !== "BANK") {
        return "Payment Voucher: Credit side must be Cash or Bank.";
      }
    }

    // 3. RECEIPT: Debit must be Cash/Bank
    if (type === "RECEIPT") {
      if (isDr && nature !== "CASH" && nature !== "BANK") {
        return "Receipt Voucher: Debit side must be Cash or Bank.";
      }
    }

    // 4. JOURNAL: No Cash/Bank allowed
    if (type === "JOURNAL") {
      if (nature === "CASH" || nature === "BANK") {
        return "Journal Voucher: Cash or Bank ledgers are NOT allowed.";
      }
    }
  }

  return null; // No errors
}
