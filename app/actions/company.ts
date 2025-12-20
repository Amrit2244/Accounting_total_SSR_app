"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DEFAULT_GROUPS, SUB_GROUPS } from "@/lib/constants";
import { setAccountingContext } from "@/lib/session";

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

// ✅ UPDATED: Include dates in Update schema
const UpdateCompanySchema = CompanySchema.extend({
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
  let cid: number;

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

    cid = newCompany.id;

    const startDate = new Date(data.financialYearFrom);
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);

    const groupMap = new Map<string, number>();

    for (const group of DEFAULT_GROUPS) {
      const created = await prisma.group.create({
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
        await prisma.group.create({
          data: {
            name: sub.name,
            nature: parentNature,
            companyId: cid,
            parentId: parentId,
          },
        });
      }
    }

    const cashGroup = await prisma.group.findFirst({
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

    await setAccountingContext(
      cid.toString(),
      startDate.toISOString(),
      endDate.toISOString()
    );
  } catch (e) {
    console.error("Create Company Error:", e);
    return { error: "Failed to create company." };
  }

  revalidatePath("/");
  redirect(`/companies/${cid}`);
}

/**
 * --- 2. SELECT COMPANY ACTION ---
 * ✅ FIXED: Removed the return of { error } to satisfy TypeScript build.
 * Form actions expect a return of void or Promise<void>.
 */
export async function selectCompanyAction(formData: FormData): Promise<void> {
  const companyId = formData.get("companyId") as string;
  const selectedYear = formData.get("fyYear") as string;

  if (!companyId || !selectedYear) {
    console.error("Selection failed: missing companyId or fyYear");
    return;
  }

  const yearNum = parseInt(selectedYear);
  const startDate = new Date(yearNum, 3, 1, 0, 0, 0);
  const endDate = new Date(yearNum + 1, 2, 31, 23, 59, 59);

  await setAccountingContext(
    companyId,
    startDate.toISOString(),
    endDate.toISOString()
  );

  revalidatePath(`/companies/${companyId}`);
  // redirect() returns 'never', which satisfies the Promise<void> requirement.
  redirect(`/companies/${companyId}`);
}

// --- 3. UPDATE COMPANY ---
export async function updateCompany(prevState: any, formData: FormData) {
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
        financialYearFrom: new Date(data.financialYearFrom),
        booksBeginFrom: new Date(data.booksBeginFrom),
      },
    });
  } catch (e) {
    console.error("Update Company Error:", e);
    return { error: "Failed to update company." };
  }

  revalidatePath("/");
  revalidatePath(`/companies/${id}`);
  return { success: true };
}

// --- 4. DELETE COMPANY ---
export async function deleteCompany(id: number) {
  try {
    const voucherCount = await prisma.voucher.count({
      where: { companyId: id },
    });
    if (voucherCount > 0)
      return { error: "Cannot delete company. Vouchers exist." };

    await prisma.$transaction([
      prisma.ledger.deleteMany({ where: { companyId: id } }),
      prisma.group.deleteMany({ where: { companyId: id } }),
      prisma.stockItem.deleteMany({ where: { companyId: id } }),
      prisma.stockGroup.deleteMany({ where: { companyId: id } }),
      prisma.unit.deleteMany({ where: { companyId: id } }),
      prisma.voucherSequence.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Delete Company Error:", e);
    return { error: "Database error occurred." };
  }
}
