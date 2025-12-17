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

// Update schema is simpler (usually excludes FY dates to prevent data corruption)
const UpdateCompanySchema = CompanySchema.omit({
  financialYearFrom: true,
  booksBeginFrom: true,
}).extend({
  id: z.coerce.number(),
});

export type CompanyState = {
  error?: string;
  success?: boolean;
};

// --- 1. CREATE COMPANY ---
export async function createCompany(prevState: any, formData: FormData) {
  const result = CompanySchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const data = result.data;

  try {
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
// UPDATED: Standardized to (prevState, formData) for useActionState compatibility
export async function updateCompany(prevState: any, formData: FormData) {
  // We extract the ID from the formData (it should be a hidden input in your form)
  const result = UpdateCompanySchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { id, ...data } = result.data;

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        state: data.state,
        pincode: data.pincode,
        email: data.email || null,
        gstin: data.gstin,
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to update company." };
  }

  revalidatePath("/");
  revalidatePath(`/companies/edit/${id}`);
  redirect("/");
}

// --- 3. DELETE COMPANY ---
export async function deleteCompany(id: number) {
  try {
    const voucherCount = await prisma.voucher.count({
      where: { companyId: id },
    });

    if (voucherCount > 0) {
      return { error: "Cannot delete company. Vouchers exist." };
    }

    // Transaction to ensure all or nothing is deleted
    await prisma.$transaction([
      prisma.ledger.deleteMany({ where: { companyId: id } }),
      prisma.accountGroup.deleteMany({ where: { companyId: id } }),
      prisma.stockItem.deleteMany({ where: { companyId: id } }),
      prisma.stockGroup.deleteMany({ where: { companyId: id } }),
      prisma.unit.deleteMany({ where: { companyId: id } }),
      prisma.voucherSequence.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    revalidatePath("/");
  } catch (e) {
    console.error("Delete failed", e);
    return { error: "Database error occurred." };
  }
}
