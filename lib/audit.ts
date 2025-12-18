import { prisma } from "@/lib/prisma";

export async function recordAudit(
  voucherId: number,
  userId: number,
  userName: string,
  action: "CREATED" | "EDITED" | "VERIFIED" | "REJECTED",
  details?: string
) {
  return await prisma.auditLog.create({
    data: {
      voucherId,
      userId,
      userName,
      action,
      details,
    },
  });
}
