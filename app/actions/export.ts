"use server";

import { prisma } from "@/lib/prisma";

export async function getFullCompanyData(companyId: number) {
  try {
    const data = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        groups: true,
        ledgers: {
          include: {
            entries: true,
          },
        },
        vouchers: {
          include: {
            entries: {
              include: { ledger: true },
            },
          },
        },
      },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to fetch company records." };
  }
}
