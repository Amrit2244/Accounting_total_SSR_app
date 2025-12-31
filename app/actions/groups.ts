"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;
  const parentIdStr = formData.get("parentId") as string;
  const parentId = parentIdStr ? parseInt(parentIdStr) : null;
  const companyId = parseInt(formData.get("companyId") as string);

  await prisma.group.create({
    data: {
      name,
      parentId,
      companyId,
      nature: "Assets", // You can update this to accept dynamic input
    },
  });

  revalidatePath(`/companies/${companyId}/chart-of-accounts`);
  redirect(`/companies/${companyId}/chart-of-accounts`);
}

export async function updateGroup(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const companyId = parseInt(formData.get("companyId") as string);

  await prisma.group.update({
    where: { id },
    data: { name },
  });

  revalidatePath(`/companies/${companyId}/chart-of-accounts`);
  redirect(`/companies/${companyId}/chart-of-accounts`);
}

export async function deleteGroup(id: number, companyId: number) {
  // Validation: Cannot delete if it has children
  const hasChildren = await prisma.group.count({ where: { parentId: id } });
  const hasLedgers = await prisma.ledger.count({ where: { groupId: id } });

  if (hasChildren > 0 || hasLedgers > 0) {
    throw new Error("Cannot delete group: It contains sub-groups or ledgers.");
  }

  await prisma.group.delete({ where: { id } });
  revalidatePath(`/companies/${companyId}/chart-of-accounts`);
}
