"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
  try {
    // 1. Fetch users (fetch everything to be safe)
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
    });

    console.log("DEBUG: Users found in DB:", users.length);

    // 2. Safely map the data to simple JSON types
    const safeUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      // Fallback: if createdAt is null, use current time
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : new Date().toISOString(),
      role: user.role || "USER", // Handle role if you use it
    }));

    return { success: true, data: safeUsers };
  } catch (error) {
    console.error("ADMIN FETCH ERROR:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function updateUser(id: number, username: string) {
  try {
    await prisma.user.update({ where: { id }, data: { username } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update" };
  }
}

export async function deleteUser(id: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.username === "admin")
      return { success: false, error: "Cannot delete Admin" };

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}
