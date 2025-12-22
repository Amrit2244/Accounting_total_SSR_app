import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. PUBLIC PATHS - Never redirect these
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;
  const activeCompanyId = req.cookies.get("activeCompanyId")?.value;

  // 2. AUTH CHECK
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verify JWT
    await jwtVerify(session, encodedKey);

    // 3. COMPANY CONTEXT CHECK
    // Only redirect to "/" if they are trying to access a dashboard WITHOUT a company cookie
    if (!activeCompanyId && pathname.startsWith("/companies/")) {
      // Allow company creation
      if (pathname === "/companies/create") return NextResponse.next();

      console.log("Middleware: No activeCompanyId found, redirecting to root");
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware: Session Invalid", error);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
