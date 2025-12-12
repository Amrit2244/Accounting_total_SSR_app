import { prisma } from "@/lib/prisma";
import VoucherForm from "./form";
import SalesPurchaseForm from "./sales-form";
import Link from "next/link";

export default async function CreateVoucherPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const companyId = parseInt(id);
  const selectedType = type?.toUpperCase() || "JOURNAL";

  // Fetch ledgers with Group Name for filtering
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      group: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const items = await prisma.stockItem.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isItemInvoice = selectedType === "SALES" || selectedType === "PURCHASE";

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-400 mt-6">
      {/* HEADER TABS */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-extrabold text-black uppercase tracking-tight">
          {isItemInvoice
            ? `${selectedType} INVOICE`
            : `${selectedType} VOUCHER`}
        </h1>

        <div className="flex gap-2">
          <Link
            href={`?type=CONTRA`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "CONTRA"
                ? "bg-gray-600 text-white border-gray-700"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Contra
          </Link>
          <Link
            href={`?type=PAYMENT`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "PAYMENT"
                ? "bg-red-600 text-white border-red-700"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Payment
          </Link>
          <Link
            href={`?type=RECEIPT`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "RECEIPT"
                ? "bg-green-600 text-white border-green-700"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Receipt
          </Link>
          <Link
            href={`?type=JOURNAL`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "JOURNAL"
                ? "bg-yellow-500 text-black border-yellow-600"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Journal
          </Link>
          <span className="w-px bg-gray-300 mx-1"></span>
          <Link
            href={`?type=SALES`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "SALES"
                ? "bg-green-400 text-black border-green-500"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Sales
          </Link>
          <Link
            href={`?type=PURCHASE`}
            className={`px-3 py-1 text-xs font-bold rounded border ${
              selectedType === "PURCHASE"
                ? "bg-yellow-200 text-black border-yellow-400"
                : "bg-gray-100 text-black border-gray-300"
            }`}
          >
            Purchase
          </Link>
        </div>
      </div>

      {/* KEY PROP FIX: 
         We add key={selectedType} so React completely resets the form 
         when you switch tabs. This fixes the "type not changing" bug.
      */}
      {isItemInvoice ? (
        <SalesPurchaseForm
          key={selectedType}
          companyId={companyId}
          type={selectedType}
          ledgers={ledgers}
          items={items}
        />
      ) : (
        <VoucherForm
          key={selectedType}
          companyId={companyId}
          ledgers={ledgers}
          defaultType={selectedType}
        />
      )}
    </div>
  );
}
