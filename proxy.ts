import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session")?.value;
  // ✅ MATCHED NAME: Must be activeCompanyId
  const activeCompanyId = req.cookies.get("activeCompanyId")?.value;

  // 1. Allow Auth Pages & Static Files
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Protect All Other Pages
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(session, encodedKey);

    // 3. Prevent Redirection Loop
    // If we have a session but NO company cookie, only allow them on the selection page (/)
    // or the company creation page.
    if (!activeCompanyId && pathname.startsWith("/companies/")) {
      if (pathname === "/companies/create") return NextResponse.next();
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
