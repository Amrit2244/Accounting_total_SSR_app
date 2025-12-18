"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch (error) {
    return null;
  }
}

export async function createBOM(prevState: any, formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const companyId = parseInt(formData.get("companyId") as string);
  const name = formData.get("name") as string;
  const finishedGoodId = parseInt(formData.get("finishedGoodId") as string);
  const targetQty = parseFloat((formData.get("targetQty") as string) || "1");
  const components = JSON.parse((formData.get("components") as string) || "[]");

  if (!finishedGoodId || components.length === 0) {
    return { error: "Select a finished good and at least one raw material." };
  }

  try {
    await prisma.bOM.create({
      data: {
        name,
        companyId,
        finishedGoodId,
        targetQty,
        createdById: userId,
        components: {
          create: components.map((c: any) => ({
            stockItemId: parseInt(c.stockItemId),
            quantity: parseFloat(c.quantity),
          })),
        },
      },
    });

    revalidatePath(`/companies/${companyId}/inventory/bom`);
    return { success: true, message: "Recipe saved successfully!" };
  } catch (error: any) {
    return { error: "Failed to save BOM: " + error.message };
  }
}

// ✅ NEW: SSR Fetcher for Recipe Auto-fill
export async function getRecipeByItem(stockItemId: number) {
  try {
    const bom = await prisma.bOM.findFirst({
      where: { finishedGoodId: stockItemId },
      include: {
        components: {
          include: {
            stockItem: {
              select: { name: true, quantity: true },
            },
          },
        },
      },
    });
    return bom;
  } catch (error) {
    return null;
  }
}
