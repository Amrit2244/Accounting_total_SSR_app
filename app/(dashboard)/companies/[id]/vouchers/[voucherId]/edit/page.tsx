// app/(dashboard)/companies/[id]/vouchers/[voucherId]/edit/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoucherEditForm from "@/components/forms/VoucherEditForm";

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string; voucherId: string }>; // Define params as a Promise
}) {
  // --- FIX: Unwrapping the Promise ---
  const resolvedParams = await params;
  const { id: idStr, voucherId: vIdStr } = resolvedParams;

  // Check 1: Ensure strings are present
  if (!idStr || !vIdStr) {
    console.error("Missing dynamic parameters in URL.");
    notFound();
  }

  // Check 2: Convert and validate integers
  const companyId = parseInt(idStr);
  const vId = parseInt(vIdStr);

  if (isNaN(companyId) || companyId <= 0 || isNaN(vId) || vId <= 0) {
    console.error(`Invalid IDs: companyId=${companyId}, vId=${vId}`);
    notFound();
  }

  // 1. Fetch Voucher Data
  const voucher = await prisma.voucher.findUnique({
    where: {
      id: vId,
      companyId: companyId,
    },
    include: {
      entries: {
        include: { ledger: true },
      },
    },
  });

  // 2. Fetch All Ledgers for the dropdowns
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  // --- Data Check ---
  if (!voucher) {
    console.error(`Voucher not found in Database for ID: ${vId}`);
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Edit Voucher:{" "}
          <span className="text-blue-600">{voucher.voucherNo || vId}</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Update transaction details and entries.
        </p>
      </div>

      <VoucherEditForm
        voucher={voucher}
        companyId={companyId}
        ledgers={ledgers}
      />
    </div>
  );
}
