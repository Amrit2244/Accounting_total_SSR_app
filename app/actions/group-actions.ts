"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateGroup(
  companyId: string,
  groupId: string,
  formData: FormData
) {
  const name = formData.get("name") as string;

  // FIX: Convert string to Number
  const groupIdInt = Number(groupId);

  await prisma.group.update({
    where: {
      id: groupIdInt,
    },
    data: {
      name,
      // REMOVED description because it does not exist in your database
    },
  });

  revalidatePath(`/companies/${companyId}/groups`);
  redirect(`/companies/${companyId}/groups`);
}
