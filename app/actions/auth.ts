"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT } from "jose";

// --- CONFIGURATION ---
const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

const FormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 chars" }),
  password: z.string().min(6, { message: "Password must be at least 6 chars" }),
  name: z.string().optional(),
});

// --- HELPER: CREATE SESSION ---
async function createSession(userId: string) {
  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 Days
    path: "/",
  });
}

// --- HELPER: DELETE SESSION ---
async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// ==========================================
// 1. REGISTER ACTION
// ==========================================
export async function register(prevState: any, formData: FormData) {
  const result = FormSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { username, password, name } = result.data;

  try {
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
        role: "ADMIN", // Default role
      },
    });

    // Create a Default Company for the new user (Optional, but helpful)
    const company = await prisma.company.create({
      data: { name: "My Company", createdById: user.id },
    });

    await createSession(user.id.toString());
  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Registration failed. Database error." };
  }

  // Redirect to the new company dashboard
  redirect("/companies/1");
}

// ==========================================
// 2. LOGIN ACTION
// ==========================================
export async function login(prevState: any, formData: FormData) {
  const result = FormSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Invalid username or password format." };
  }

  const { username, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Invalid credentials." };
    }

    await createSession(user.id.toString());
  } catch (error) {
    return { error: "Login failed. Database error." };
  }

  // ✅ REDIRECT TO DASHBOARD (Instead of "/")
  redirect("/companies/1");
}

// ==========================================
// 3. LOGOUT ACTION
// ==========================================
export async function logout() {
  await deleteSession();
  redirect("/login");
}
