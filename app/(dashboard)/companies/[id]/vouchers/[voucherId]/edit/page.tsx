import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoucherEditForm from "@/components/forms/VoucherEditForm";

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string; voucherId: string }>;
}) {
  const resolvedParams = await params;
  const { id: idStr, voucherId: vIdStr } = resolvedParams;

  const companyId = parseInt(idStr);
  const vId = parseInt(vIdStr);

  if (isNaN(companyId) || isNaN(vId)) notFound();

  // 1. Fetch Voucher with BOTH Entries (Ledgers) AND Inventory (Items)
  const voucher = await prisma.voucher.findUnique({
    where: { id: vId, companyId: companyId },
    include: {
      entries: {
        include: { ledger: true },
      },
      inventory: {
        include: { stockItem: true },
      },
    },
  });

  if (!voucher) notFound();

  // 2. Fetch Masters for the dropdowns
  const [ledgers, stockItems] = await Promise.all([
    prisma.ledger.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    prisma.stockItem.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Edit {voucher.type} Voucher:{" "}
          <span className="text-blue-600">#{voucher.voucherNo}</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Update your transaction and inventory details below.
        </p>
      </div>

      <VoucherEditForm
        voucher={voucher}
        companyId={companyId}
        ledgers={ledgers}
        stockItems={stockItems}
      />
    </div>
  );
}
