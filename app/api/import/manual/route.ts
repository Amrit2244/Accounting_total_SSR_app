import { NextResponse } from "next/server";
import {
  syncLocalTally,
  getVoucherList,
  syncSingleVoucher,
  getCurrentUserId,
} from "@/app/actions/tally"; // Adjust path to point to your actions file

export const maxDuration = 60; // Set timeout to 60 seconds (Vercel Pro) or higher if self-hosted

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { companyId, fromDate, toDate, type } = body;

    // 1. Fetch the list of ALL voucher IDs from Tally
    const voucherIds = await getVoucherList(companyId, fromDate, toDate, type);
    console.log(`Found ${voucherIds.length} vouchers to sync.`);

    let successCount = 0;
    let failCount = 0;

    // --- CRITICAL FIX: USE 'for...of' LOOP ---
    // Do NOT use voucherIds.forEach() -> It does not wait for await!
    // Do NOT put 'return' inside this loop!
    for (const vNum of voucherIds) {
      // Pass the 'type' to ensure we don't mix Payment/Receipt IDs
      const success = await syncSingleVoucher(companyId, vNum, type);

      if (success) {
        successCount++;
        // Optional: Log progress every 10 vouchers
        if (successCount % 10 === 0)
          console.log(`Synced ${successCount}/${voucherIds.length}...`);
      } else {
        failCount++;
        console.error(`Failed to sync voucher #${vNum}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync Complete. Saved: ${successCount}, Failed: ${failCount}`,
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
