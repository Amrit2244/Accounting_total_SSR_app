import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  // 1. If no session and trying to access protected routes, redirect to login
  if (
    !session &&
    !req.nextUrl.pathname.startsWith("/login") &&
    !req.nextUrl.pathname.startsWith("/register")
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. If session exists, verify it
  if (session) {
    try {
      await jwtVerify(session, encodedKey);
      // If user is logged in and tries to go to login page, send to dashboard
      if (
        req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/register")
      ) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      // If verification fails (tampered cookie), delete it and redirect
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except static files and images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
