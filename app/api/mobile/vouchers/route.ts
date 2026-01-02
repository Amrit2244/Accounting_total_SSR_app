import { NextRequest, NextResponse } from "next/server";
import { getVouchers, createVoucher } from "@/app/actions/voucher";
import { jwtVerify } from "jose";

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

// Helper to verify Mobile Token
async function getMobileUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.split(" ")[1];
  const { payload } = await jwtVerify(token, encodedKey);
  return payload.userId as number;
}

export async function GET(req: NextRequest) {
  const userId = await getMobileUser(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const companyId = parseInt(searchParams.get("companyId") || "0");

  // Reuse your exact SSR Logic
  const vouchers = await getVouchers(companyId);
  return NextResponse.json({ success: true, vouchers });
}

export async function POST(req: NextRequest) {
  const userId = await getMobileUser(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json(); // Data from mobile form

  // We mimic the FormData structure your createVoucher action expects
  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  // Call your existing createVoucher logic (Maker status is set automatically)
  const result = await createVoucher({}, formData);
  return NextResponse.json(result);
}
