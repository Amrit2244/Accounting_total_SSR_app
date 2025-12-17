import { prisma } from "@/lib/prisma";
import VoucherForm from "@/components/forms/VoucherForm"; // Pure Accounting Form
import SalesPurchaseForm from "@/components/forms/SalesPurchaseForm"; // Inventory Form
import Link from "next/link";
import clsx from "clsx";
import {
  FileText,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  ShoppingCart,
  Truck,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

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

  // Default to JOURNAL if no type selected
  const voucherType = (type || "JOURNAL").toUpperCase();

  // --- 1. DEFINE VOUCHER TYPES NAVIGATION ---
  const voucherTypes = [
    {
      id: "CONTRA",
      label: "Contra",
      icon: ArrowLeftRight,
      color: "hover:bg-gray-100 text-slate-600",
      activeColor:
        "bg-white border-b-4 border-slate-600 text-slate-800 shadow-lg",
    },
    {
      id: "PAYMENT",
      label: "Payment",
      icon: CreditCard,
      color: "hover:bg-orange-50 text-orange-700",
      activeColor:
        "bg-white border-b-4 border-orange-500 text-orange-800 shadow-lg",
    },
    {
      id: "RECEIPT",
      label: "Receipt",
      icon: Wallet,
      color: "hover:bg-green-50 text-green-700",
      activeColor:
        "bg-white border-b-4 border-green-500 text-green-800 shadow-lg",
    },
    {
      id: "JOURNAL",
      label: "Journal",
      icon: FileText,
      color: "hover:bg-blue-50 text-blue-700",
      activeColor:
        "bg-white border-b-4 border-blue-500 text-blue-800 shadow-lg",
    },
    {
      id: "SALES",
      label: "Sales",
      icon: ShoppingCart,
      color: "hover:bg-teal-50 text-teal-700",
      activeColor:
        "bg-white border-b-4 border-teal-500 text-teal-800 shadow-lg",
    },
    {
      id: "PURCHASE",
      label: "Purchase",
      icon: Truck,
      color: "hover:bg-purple-50 text-purple-700",
      activeColor:
        "bg-white border-b-4 border-purple-500 text-purple-800 shadow-lg",
    },
  ];

  const currentVoucher =
    voucherTypes.find((v) => v.id === voucherType) || voucherTypes[3]; // Default to Journal

  // --- 2. FETCH DATA ---
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
    select: { id: true, name: true, gstRate: true },
    orderBy: { name: "asc" },
  });

  const isInventory = voucherType === "SALES" || voucherType === "PURCHASE";

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* --- TOP HEADER & BREADCRUMBS --- */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="hover:text-blue-600 transition-colors"
            >
              Daybook
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">New Voucher</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Create {currentVoucher.label} Voucher
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* --- VOUCHER TYPE TABS --- */}
      <div className="grid grid-cols-6 gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-inner">
        {voucherTypes.map((v) => {
          const isActive = voucherType === v.id;
          return (
            <Link
              key={v.id}
              href={`/companies/${companyId}/vouchers/create?type=${v.id}`}
              className={clsx(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 border-b-2",
                isActive
                  ? v.activeColor
                  : v.color +
                      " bg-white/50 border-transparent hover:bg-white/90"
              )}
            >
              <v.icon size={20} className="mb-1" />
              <span className="text-xs font-extrabold uppercase">
                {v.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* --- FORM CONTAINER --- */}
      <div className="bg-white p-8 border border-slate-200 shadow-xl rounded-xl min-h-[600px]">
        {isInventory ? (
          <SalesPurchaseForm
            companyId={companyId}
            type={voucherType}
            ledgers={ledgers}
            items={items}
          />
        ) : (
          <VoucherForm
            companyId={companyId}
            ledgers={ledgers}
            defaultType={voucherType}
          />
        )}
      </div>
    </div>
  );
}
