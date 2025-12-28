"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT } from "jose";
import { jwtVerify } from "jose";

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

  // FIX: Changed secure to false so login works on IP address (HTTP)
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
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
  let newCompanyId = 1;

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
        role: "ADMIN",
      },
    });

    const today = new Date();
    const currentYear = today.getFullYear();
    const fyStart = new Date(currentYear, 3, 1);

    const company = await prisma.company.create({
      data: {
        name: "My Company",
        financialYearFrom: fyStart,
        booksBeginFrom: fyStart,
      },
    });

    newCompanyId = company.id;
    await createSession(user.id.toString());
  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Registration failed. Database error." };
  }

  redirect(`/companies/${newCompanyId}`);
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
  let companyIdToRedirect = 1;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Invalid credentials." };
    }

    await createSession(user.id.toString());

    const firstCompany = await prisma.company.findFirst();
    if (firstCompany) {
      companyIdToRedirect = firstCompany.id;
    }
  } catch (error) {
    return { error: "Login failed. Database error." };
  }

  // redirect(`/companies/${companyIdToRedirect}`);
  redirect("/");
}

//------------------------get the current user for tally import---------------
export async function getCurrentUserId(): Promise<number | null> {
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
// ==========================================
// 3. LOGOUT ACTION
// ==========================================
export async function logout() {
  await deleteSession();
  redirect("/login");
}
