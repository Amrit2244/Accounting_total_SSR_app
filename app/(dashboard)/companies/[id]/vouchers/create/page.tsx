import { prisma } from "@/lib/prisma";
import VoucherForm from "@/components/forms/VoucherForm";
import SalesPurchaseForm from "@/components/forms/SalesPurchaseForm";
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
  const voucherType = (type || "JOURNAL").toUpperCase();

  const voucherTypes = [
    {
      id: "CONTRA",
      label: "Contra",
      icon: ArrowLeftRight,
      color: "text-slate-600",
      active: "border-slate-600 text-slate-800",
    },
    {
      id: "PAYMENT",
      label: "Payment",
      icon: CreditCard,
      color: "text-orange-600",
      active: "border-orange-500 text-orange-800",
    },
    {
      id: "RECEIPT",
      label: "Receipt",
      icon: Wallet,
      color: "text-green-600",
      active: "border-green-500 text-green-800",
    },
    {
      id: "JOURNAL",
      label: "Journal",
      icon: FileText,
      color: "text-blue-600",
      active: "border-blue-500 text-blue-800",
    },
    {
      id: "SALES",
      label: "Sales",
      icon: ShoppingCart,
      color: "text-teal-600",
      active: "border-teal-500 text-teal-800",
    },
    {
      id: "PURCHASE",
      label: "Purchase",
      icon: Truck,
      color: "text-purple-600",
      active: "border-purple-500 text-purple-800",
    },
  ];

  const currentVoucher =
    voucherTypes.find((v) => v.id === voucherType) || voucherTypes[3];
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    select: { id: true, name: true, group: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    select: { id: true, name: true, gstRate: true },
    orderBy: { name: "asc" },
  });
  const isInventory = voucherType === "SALES" || voucherType === "PURCHASE";

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 mb-0.5">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="hover:text-blue-600"
            >
              Daybook
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900">New Entry</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Create {currentVoucher.label} Voucher
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-6 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {voucherTypes.map((v) => {
          const isActive = voucherType === v.id;
          return (
            <Link
              key={v.id}
              href={`?type=${v.id}`}
              className={clsx(
                "flex flex-col items-center justify-center py-2 rounded-lg transition-all border-b-2 text-[10px] font-black uppercase tracking-wide",
                isActive
                  ? `bg-white shadow-sm ${v.active}`
                  : `hover:bg-white/60 border-transparent ${v.color}`
              )}
            >
              <v.icon size={16} className="mb-1" /> {v.label}
            </Link>
          );
        })}
      </div>

      {/* FORM AREA */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-xl min-h-[500px]">
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
