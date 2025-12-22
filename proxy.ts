import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass all static files and auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;
  const activeCompanyId = req.cookies.get("activeCompanyId")?.value;

  // DEBUG LOGS (View these with 'pm2 logs')
  console.log(
    `Path: ${pathname} | Session: ${!!session} | Company: ${activeCompanyId}`
  );

  // 2. Auth Check
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(session, encodedKey);

    // 3. The Loop Fix
    // If they ARE on a company page, just let them stay there.
    // We only redirect if they are logged in but haven't picked a company yet.
    if (pathname.startsWith("/companies/")) {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth Error:", error);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
