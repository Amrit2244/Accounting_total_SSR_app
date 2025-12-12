"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DEFAULT_GROUPS, SUB_GROUPS } from "@/lib/constants";

// --- Validation Schema ---
const CompanySchema = z.object({
  name: z.string().min(1, "Company Name is required"),
  address: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstin: z.string().optional(),
  financialYearFrom: z.string(),
  booksBeginFrom: z.string(),
});

// --- 1. CREATE COMPANY ---
export async function createCompany(prevState: any, formData: FormData) {
  const result = CompanySchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const data = result.data;

  try {
    // 1. Create the Company Record
    const newCompany = await prisma.company.create({
      data: {
        name: data.name,
        address: data.address,
        state: data.state,
        pincode: data.pincode,
        email: data.email || null,
        gstin: data.gstin,
        financialYearFrom: new Date(data.financialYearFrom),
        booksBeginFrom: new Date(data.booksBeginFrom),
      },
    });

    const cid = newCompany.id;

    // 2. Create Primary Groups (e.g., Assets, Liabilities)
    const groupMap = new Map<string, number>();

    for (const group of DEFAULT_GROUPS) {
      const created = await prisma.accountGroup.create({
        data: {
          name: group.name,
          nature: group.nature,
          companyId: cid,
        },
      });
      groupMap.set(group.name, created.id);
    }

    // 3. Create Sub-Groups (e.g., Cash-in-hand under Current Assets)
    for (const sub of SUB_GROUPS) {
      const parentId = groupMap.get(sub.parent);
      if (parentId) {
        const parentNature =
          DEFAULT_GROUPS.find((g) => g.name === sub.parent)?.nature || "ASSET";

        await prisma.accountGroup.create({
          data: {
            name: sub.name,
            nature: parentNature,
            companyId: cid,
            parentId: parentId,
          },
        });
      }
    }

    // 4. Create Default "Cash" Ledger
    const cashGroup = await prisma.accountGroup.findFirst({
      where: { name: "Cash-in-hand", companyId: cid },
    });

    if (cashGroup) {
      await prisma.ledger.create({
        data: {
          name: "Cash",
          groupId: cashGroup.id,
          companyId: cid,
          tallyName: "Cash",
        },
      });
    }
  } catch (e) {
    console.error(e);
    return { error: "Failed to create company." };
  }

  revalidatePath("/");
  redirect("/");
}

// --- 2. UPDATE COMPANY ---
export async function updateCompany(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const state = formData.get("state") as string;
  const pincode = formData.get("pincode") as string;
  const email = formData.get("email") as string;
  const gstin = formData.get("gstin") as string;

  if (!name) return { error: "Company Name is required" };

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name,
        address,
        state,
        pincode,
        email: email || null,
        gstin,
      },
    });
  } catch (e) {
    return { error: "Failed to update company." };
  }

  revalidatePath("/");
  redirect("/");
}

// --- 3. DELETE COMPANY (Safe Delete) ---
export async function deleteCompany(id: number) {
  try {
    // 1. Check for Vouchers
    const voucherCount = await prisma.voucher.count({
      where: { companyId: id },
    });

    if (voucherCount > 0) {
      console.error("Cannot delete company with existing vouchers");
      return { error: "Cannot delete company. Vouchers exist." };
    }

    // 2. Safe to Delete (Delete Masters first to avoid FK errors)
    await prisma.ledger.deleteMany({ where: { companyId: id } });
    await prisma.accountGroup.deleteMany({ where: { companyId: id } });
    await prisma.stockItem.deleteMany({ where: { companyId: id } });
    await prisma.stockGroup.deleteMany({ where: { companyId: id } });
    await prisma.unit.deleteMany({ where: { companyId: id } });
    await prisma.voucherSequence.deleteMany({ where: { companyId: id } });

    // 3. Delete Company
    await prisma.company.delete({ where: { id } });

    revalidatePath("/");
  } catch (e) {
    console.error("Delete failed", e);
    return { error: "Database error occurred." };
  }
}
