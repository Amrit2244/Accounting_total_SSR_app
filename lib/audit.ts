import { prisma } from "@/lib/prisma";

export async function recordAudit(
  voucherId: number,
  voucherType: string, // ✅ Added Type
  userId: number,
  userName: string,
  action: "CREATED" | "EDITED" | "VERIFIED" | "REJECTED",
  details?: string
) {
  try {
    return await prisma.auditLog.create({
      data: {
        voucherId,
        voucherType, // ✅ Save Type
        userId,
        userName,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
    // We don't want audit failure to crash the main transaction, so we just log it.
    return null;
  }
}
