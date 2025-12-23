"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEFAULT_GROUPS, SUB_GROUPS } from "@/lib/constants";

// --- SCHEMAS ---
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

const UpdateCompanySchema = CompanySchema.extend({ id: z.coerce.number() });

// --- 1. CREATE COMPANY ---
export async function createCompany(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = CompanySchema.safeParse(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Validation Error",
    };
  }

  const {
    name,
    address,
    state,
    pincode,
    email,
    gstin,
    financialYearFrom,
    booksBeginFrom,
  } = result.data;

  try {
    // We use a generic 'any' for tx here to bypass the "@prisma/client has no member Prisma"
    // export error while still ensuring the transaction logic is sound.
    const newCompany = await prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({
        data: {
          name,
          address,
          state,
          pincode,
          email,
          gstin,
          financialYearFrom: new Date(financialYearFrom),
          booksBeginFrom: new Date(booksBeginFrom),
        },
      });

      const groupMap = new Map<string, number>();

      for (const g of DEFAULT_GROUPS) {
        const createdGroup = await tx.group.create({
          data: {
            name: g.name,
            nature: g.nature,
            companyId: company.id,
          },
        });
        groupMap.set(g.name, createdGroup.id);
      }

      for (const sg of SUB_GROUPS) {
        const parentId = groupMap.get(sg.parent);
        if (parentId) {
          await tx.group.create({
            data: {
              name: sg.name,
              parentId: parentId,
              companyId: company.id,
            },
          });
        }
      }
      return company;
    });

    revalidatePath("/");
    // Redirect moved below to be outside the try block
  } catch (e: any) {
    console.error("Create Company Error:", e);
    return { message: "Database Error: Failed to create company." };
  }

  redirect("/");
}

// --- 2. SELECT COMPANY ---
export async function selectCompanyAction(formData: FormData) {
  const companyId = formData.get("companyId");
  const fyYear = formData.get("fyYear");

  if (!companyId || !fyYear) {
    throw new Error("Invalid Selection");
  }

  const cid = parseInt(companyId.toString());
  const year = parseInt(fyYear.toString());

  const startDate = new Date(Date.UTC(year, 3, 1));
  const endDate = new Date(Date.UTC(year + 1, 2, 31));

  const cookieStore = await cookies();

  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    maxAge: 60 * 60 * 24 * 7,
  };

  cookieStore.set("activeCompanyId", cid.toString(), cookieOptions);
  cookieStore.set("active_fy_start", startDate.toISOString(), cookieOptions);
  cookieStore.set("active_fy_end", endDate.toISOString(), cookieOptions);
  cookieStore.set("active_fy_label", `FY ${year}-${year + 1}`, cookieOptions);

  redirect(`/companies/${cid}`);
}

// --- 3. UPDATE COMPANY ---
export async function updateCompany(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = UpdateCompanySchema.safeParse(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Validation Error",
    };
  }

  const {
    id,
    name,
    address,
    state,
    pincode,
    email,
    gstin,
    financialYearFrom,
    booksBeginFrom,
  } = result.data;

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name,
        address,
        state,
        pincode,
        email,
        gstin,
        financialYearFrom: new Date(financialYearFrom),
        booksBeginFrom: new Date(booksBeginFrom),
      },
    });
  } catch (e) {
    return { message: "Update Failed" };
  }

  revalidatePath("/");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

// --- 4. DELETE COMPANY ---
export async function deleteCompany(id: number) {
  try {
    await prisma.$transaction([
      prisma.ledger.deleteMany({ where: { companyId: id } }),
      prisma.group.deleteMany({ where: { companyId: id } }),
      prisma.stockItem.deleteMany({ where: { companyId: id } }),
      prisma.stockGroup.deleteMany({ where: { companyId: id } }),
      prisma.unit.deleteMany({ where: { companyId: id } }),
      prisma.voucherSequence.deleteMany({ where: { companyId: id } }),
      prisma.salesVoucher.deleteMany({ where: { companyId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { companyId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { companyId: id } }),
      prisma.receiptVoucher.deleteMany({ where: { companyId: id } }),
      prisma.contraVoucher.deleteMany({ where: { companyId: id } }),
      prisma.journalVoucher.deleteMany({ where: { companyId: id } }),
      prisma.stockJournal.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);
  } catch (e) {
    console.error("Delete Company Error:", e);
    return { error: "Delete failed. Check server logs." };
  }

  revalidatePath("/");
  redirect("/");
}
