import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ==========================================================
  // 1. MOBILE API LOGIC (CORS & PREFLIGHT)
  // ==========================================================
  if (pathname.startsWith("/api/mobile")) {
    // console.log(">>> MOBILE REQUEST:", req.method, pathname);

    // Handle Preflight (OPTIONS) - MUST return immediately
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Handle Actual Requests (GET, POST, etc.)
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  }

  // ==========================================================
  // 2. BYPASS LOGIC (Static files & Auth pages)
  // ==========================================================
  if (
    pathname.startsWith("/_next") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/mobile")) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ==========================================================
  // 3. WEB SSR AUTH LOGIC (Cookies & Session)
  // ==========================================================
  const session = req.cookies.get("session")?.value;
  const companyId = req.cookies.get("selected_company_id")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(session, encodedKey);

    // Prevent loop: If on Select Company page or creating, let them stay
    if (pathname === "/" || pathname === "/companies/create") {
      return NextResponse.next();
    }

    // Context Check: Require company selection for deep links
    if (!companyId && pathname.startsWith("/companies/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If JWT is invalid, clear session and force login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
