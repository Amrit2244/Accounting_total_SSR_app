// middleware.ts
import { NextResponse } from "next/server";
// ✅ FIXED: Import from "next/server", not "next/request"
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const selectedCompany = req.cookies.get("selected_company_id")?.value;
  const { pathname } = req.nextUrl;

  // 1. Allow Auth Pages (Login/Register)
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.next();
  }

  // 2. Protect All Other Pages
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(session, encodedKey);

    // 3. FY Context Protection:
    // If they try to go to a specific company page BUT haven't selected a company context yet,
    // send them back to the root selection page (app/(dashboard)/page.tsx)
    if (!selectedCompany && pathname.startsWith("/companies/")) {
      // Allow them to go to the company creation page even without a context
      if (pathname === "/companies/create") return NextResponse.next();

      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If the JWT is invalid or expired, clear session and force login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
