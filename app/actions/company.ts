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
    // Transaction: Create Company -> Seed Default Groups
    const newCompany = await prisma.$transaction(async (tx) => {
      // 1. Create Company
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

      // 2. Seed Default Primary Groups (e.g., Capital, Current Assets)
      const groupMap = new Map<string, number>();

      for (const g of DEFAULT_GROUPS) {
        const createdGroup = await tx.group.create({
          data: {
            name: g.name,
            nature: g.nature, // ASSET, LIABILITY, INCOME, EXPENSE
            companyId: company.id,
          },
        });
        groupMap.set(g.name, createdGroup.id);
      }

      // 3. Seed Sub-Groups (e.g., Cash-in-hand under Current Assets)
      for (const sg of SUB_GROUPS) {
        const parentId = groupMap.get(sg.parent);
        if (parentId) {
          await tx.group.create({
            data: {
              name: sg.name,
              // ✅ FIXED: Removed 'nature: sg.nature' because it doesn't exist on SUB_GROUPS items
              parentId: parentId,
              companyId: company.id,
            },
          });
        }
      }

      return company;
    });

    revalidatePath("/");
    return { success: true, companyId: newCompany.id };
  } catch (e: any) {
    console.error("Create Company Error:", e);
    return { message: "Database Error: Failed to create company." };
  }
}

// --- 2. SELECT COMPANY (Login to Workspace) ---
export async function selectCompanyAction(formData: FormData) {
  const companyId = formData.get("companyId");
  const fyYear = formData.get("fyYear");

  if (!companyId || !fyYear) {
    throw new Error("Invalid Selection");
  }

  const cid = parseInt(companyId.toString());
  const year = parseInt(fyYear.toString());

  // 1. Calculate Fiscal Year Dates (April 1 to March 31)
  // Using UTC to prevent timezone shifts during the selection process
  const startDate = new Date(Date.UTC(year, 3, 1)); // April 1st
  const endDate = new Date(Date.UTC(year + 1, 2, 31)); // March 31st

  const cookieStore = await cookies();

  // 2. Cookie Configuration
  // secure: false is used here to ensure it works on your VPS IP address (HTTP)
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    maxAge: 60 * 60 * 24 * 7, // 7 Days
  };

  // 3. Set Active Company ID
  // ✅ MATCHES: proxy.ts and session.ts
  cookieStore.set("activeCompanyId", cid.toString(), cookieOptions);

  // 4. Set Individual Fiscal Year Cookies
  // ✅ MATCHES: session.ts getAccountingContext()
  cookieStore.set("active_fy_start", startDate.toISOString(), cookieOptions);
  cookieStore.set("active_fy_end", endDate.toISOString(), cookieOptions);

  // 5. Optional: Set the label for UI display
  cookieStore.set("active_fy_label", `FY ${year}-${year + 1}`, cookieOptions);

  // 6. Redirect to the Dashboard
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

    revalidatePath("/");
    revalidatePath(`/companies/${id}`);
    return { success: true };
  } catch (e) {
    return { message: "Update Failed" };
  }
}

// --- 4. DELETE COMPANY ---
export async function deleteCompany(id: number) {
  try {
    await prisma.$transaction([
      // 1. Delete Ledger & Group Data
      prisma.ledger.deleteMany({ where: { companyId: id } }),
      prisma.group.deleteMany({ where: { companyId: id } }),

      // 2. Delete Inventory Data
      prisma.stockItem.deleteMany({ where: { companyId: id } }),
      prisma.stockGroup.deleteMany({ where: { companyId: id } }),
      prisma.unit.deleteMany({ where: { companyId: id } }),

      // 3. Delete Sequences
      prisma.voucherSequence.deleteMany({ where: { companyId: id } }),

      // 4. Delete ALL Voucher Types (New Multi-Table Schema)
      prisma.salesVoucher.deleteMany({ where: { companyId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { companyId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { companyId: id } }),
      prisma.receiptVoucher.deleteMany({ where: { companyId: id } }),
      prisma.contraVoucher.deleteMany({ where: { companyId: id } }),
      prisma.journalVoucher.deleteMany({ where: { companyId: id } }),
      prisma.stockJournal.deleteMany({ where: { companyId: id } }),

      // 5. Finally, Delete the Company
      prisma.company.delete({ where: { id } }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Delete Company Error:", e);
    return { error: "Delete failed. Check server logs." };
  }
}
