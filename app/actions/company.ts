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
    secure: false, // Set to false to support HTTP/IP-based cloud access
    maxAge: 60 * 60 * 24 * 7,
  };

  cookieStore.set("selected_company_id", cid.toString(), cookieOptions);
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

// --- 4. DELETE COMPANY (SINGLE, CORRECT DEFINITION) ---
export async function deleteCompany(companyId: number) {
  try {
    // 1. Security Check: Ensure no vouchers exist
    const counts = await prisma.$transaction([
      prisma.salesVoucher.count({ where: { companyId } }),
      prisma.purchaseVoucher.count({ where: { companyId } }),
      prisma.paymentVoucher.count({ where: { companyId } }),
      prisma.receiptVoucher.count({ where: { companyId } }),
      prisma.contraVoucher.count({ where: { companyId } }),
      prisma.journalVoucher.count({ where: { companyId } }),
      prisma.stockJournal.count({ where: { companyId } }),
    ]);

    const totalVouchers = counts.reduce((a, b) => a + b, 0);

    if (totalVouchers > 0) {
      return {
        success: false,
        error: "Cannot delete: Company contains active transactions.",
      };
    }

    // 2. Perform Clean Delete
    await prisma.$transaction([
      prisma.voucherSequence.deleteMany({ where: { companyId } }),
      prisma.bOMItem.deleteMany({ where: { bom: { companyId } } }),
      prisma.bOM.deleteMany({ where: { companyId } }),
      prisma.stockItem.deleteMany({ where: { companyId } }),
      prisma.stockGroup.deleteMany({ where: { companyId } }),
      prisma.unit.deleteMany({ where: { companyId } }),
      prisma.ledger.deleteMany({ where: { companyId } }),
      prisma.group.deleteMany({ where: { companyId } }),
      prisma.company.delete({ where: { id: companyId } }),
    ]);
  } catch (error: any) {
    console.error("Delete Company Error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete company",
    };
  }

  // 3. Redirect to Home/Dashboard after success
  revalidatePath("/");
  redirect("/");
}
