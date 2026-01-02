import { NextRequest, NextResponse } from "next/server";
import { updateVoucher, verifyVoucher } from "@/app/actions/voucher";

// Verify Voucher (CHECKER LOGIC)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json(); // { type: "PAYMENT" }
  const result = await verifyVoucher(parseInt(params.id), body.type);

  // If result.success is false, it means Maker = Checker (Security Blocked)
  return NextResponse.json(result);
}

// Edit Voucher (MAKER LOGIC)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { companyId, type, ...data } = body;

  // Reuse your updateVoucher logic which generates the NEW TXID automatically
  const result = await updateVoucher(
    parseInt(params.id),
    companyId,
    type,
    data
  );
  return NextResponse.json(result);
}
