import { NextRequest, NextResponse } from "next/server";
import { updateVoucher, verifyVoucher } from "@/app/actions/voucher";

// ✅ Update: params must be a Promise in Next.js 16
type RouteContext = {
  params: Promise<{ id: string }>;
};

// Verify Voucher (CHECKER LOGIC)
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const resolvedParams = await params; // 1. Await the promise
    const voucherId = parseInt(resolvedParams.id);

    const body = await req.json(); // { type: "PAYMENT" }

    // Call the existing verifyVoucher logic
    const result = await verifyVoucher(voucherId, body.type);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Verification process failed" },
      { status: 500 }
    );
  }
}

// Edit Voucher (MAKER LOGIC)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const resolvedParams = await params; // 1. Await the promise
    const voucherId = parseInt(resolvedParams.id);

    const body = await req.json();
    const { companyId, type, ...data } = body;

    // Call the existing updateVoucher logic
    const result = await updateVoucher(voucherId, companyId, type, data);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
