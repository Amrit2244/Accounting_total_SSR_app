import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- MOBILE API CORS LOGIC ---
  if (pathname.startsWith("/api/mobile")) {
    // Handle Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

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

  // --- EXISTING WEB SSR LOGIC ---
  // 1. Bypass static files and standard API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // This handles standard APIs (non-mobile)
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;
  const companyId = req.cookies.get("selected_company_id")?.value;

  // 2. Auth Check
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(session, encodedKey);

    // 3. Prevent loop
    if (pathname === "/" || pathname === "/companies/create") {
      return NextResponse.next();
    }

    // 4. Context Check
    if (!companyId && pathname.startsWith("/companies/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

// Updated matcher to include both Web routes and Mobile API routes
export const config = {
  matcher: [
    "/api/mobile/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
