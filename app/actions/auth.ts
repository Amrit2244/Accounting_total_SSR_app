"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 chars" }),
  password: z.string().min(6, { message: "Password must be at least 6 chars" }),
  name: z.string().optional(),
});

export async function register(prevState: any, formData: FormData) {
  const result = FormSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    // ✅ FIX: Use .format() or access .issues safely
    const firstErrorMessage = result.error.issues[0].message;
    return { error: firstErrorMessage };
  }

  const { username, password, name } = result.data;

  // Prisma check
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { error: "Username already taken." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name: name || username,
    },
  });

  await createSession(user.id.toString());
  redirect("/login");
}

export async function login(prevState: any, formData: FormData) {
  const result = FormSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Invalid username or password format." };
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid credentials." };
  }

  await createSession(user.id.toString());
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
