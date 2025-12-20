import "server-only";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: false, // Set to false for HTTP IP access
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// ✅ UPDATED: Helper to get selected FY context
export async function getAccountingContext() {
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;
  const fyStart = cookieStore.get("active_fy_start")?.value;
  const fyEnd = cookieStore.get("active_fy_end")?.value;

  if (!companyId || !fyStart || !fyEnd) return null;

  return {
    companyId: parseInt(companyId),
    startDate: new Date(fyStart),
    endDate: new Date(fyEnd),
  };
}

// ✅ UPDATED: Helper to set context (Matches Middleware Cookie Name)
export async function setAccountingContext(
  companyId: string,
  start: string,
  end: string
) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    secure: false, // Set to false for HTTP IP access
    path: "/",
    maxAge: 60 * 60 * 24, // 1 Day
  };

  cookieStore.set("selected_company_id", companyId, options);
  cookieStore.set("active_fy_start", start, options);
  cookieStore.set("active_fy_end", end, options);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("selected_company_id");
  cookieStore.delete("active_fy_start");
  cookieStore.delete("active_fy_end");
}
