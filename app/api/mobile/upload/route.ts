import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const voucherId = formData.get("voucherId") as string;
  const type = formData.get("type") as string;

  // 1. Upload to your Cloud Storage (S3/Cloudinary/Local)
  // const fileUrl = await uploadFile(file);

  // 2. Update the specific voucher table with the image link
  // await (prisma as any)[`${type.toLowerCase()}Voucher`].update(...)

  return NextResponse.json({ success: true, message: "Proof attached" });
}
