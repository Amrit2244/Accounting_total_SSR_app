import { NextRequest, NextResponse } from "next/server";
import { getVouchers, createVoucher } from "@/app/actions/voucher";
import { jwtVerify } from "jose";

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

/**
 * HELPER: Identifies the Mobile User from the JWT Bearer Token
 */
async function getMobileUser(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    const { payload } = await jwtVerify(token, encodedKey);
    return payload.userId as number;
  } catch (err) {
    return null;
  }
}

/**
 * GET: Fetch Daybook (All Vouchers)
 * Purpose: Returns formatted vouchers for the mobile list view.
 */
export async function GET(req: NextRequest) {
  const userId = await getMobileUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = parseInt(searchParams.get("companyId") || "0");

  try {
    // 1. Fetch raw vouchers using your existing SSR Logic
    const vouchers = await getVouchers(companyId);

    // 2. APPLY TALLY-STYLE FORMATTING
    // We determine the Dr/Cr labels so the mobile app doesn't have to calculate them.
    const formattedVouchers = vouchers.map((v: any) => {
      const entries = v.ledgerEntries || [];

      /** * TALLY CONVENTION:
       * Negative Amount = Debit (Dr)
       * Positive Amount = Credit (Cr)
       */
      const drLabel =
        entries.find((e: any) => e.amount < 0)?.ledger?.name || "—";
      const crLabel =
        entries.find((e: any) => e.amount > 0)?.ledger?.name || "—";

      return {
        ...v,
        displayParticulars: `${drLabel} / ${crLabel}`,
        // Map entries to absolute amounts for easier UI display
        entries: entries.map((e: any) => ({
          ...e,
          displayAmount: Math.abs(e.amount),
          side: e.amount < 0 ? "Dr" : "Cr",
        })),
      };
    });

    return NextResponse.json({
      success: true,
      vouchers: formattedVouchers,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch daybook entries",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a New Voucher
 * Purpose: Receives JSON from Mobile, converts to FormData for your existing SSR Action.
 */
export async function POST(req: NextRequest) {
  const userId = await getMobileUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json(); // Data received from mobile UI

    /**
     * Reusing existing createVoucher Action:
     * Your Server Action expects FormData. We mimic that here to ensure
     * logic parity (Maker status, TXID generation, and validations remain the same).
     */
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      // If value is an object (like ledgerEntries), stringify it
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Call your existing createVoucher logic
    const result = await createVoucher({}, formData);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create voucher",
      },
      { status: 500 }
    );
  }
}
