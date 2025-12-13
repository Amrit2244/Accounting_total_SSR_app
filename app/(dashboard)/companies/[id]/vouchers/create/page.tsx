import { prisma } from "@/lib/prisma";
import VoucherForm from "./form";
import SalesPurchaseForm from "./sales-form";
import Link from "next/link";
import clsx from "clsx";
import {
  FileText,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  ShoppingCart,
  Truck,
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
  const voucherType = type || "JOURNAL";

  // --- 1. DEFINE VOUCHER TYPES NAVIGATION ---
  const voucherTypes = [
    {
      id: "CONTRA",
      label: "Contra",
      icon: ArrowLeftRight,
      color: "hover:bg-gray-100 border-gray-200 text-gray-700",
      activeColor:
        "bg-white border-t-4 border-t-slate-600 text-slate-800 shadow-sm",
    },
    {
      id: "PAYMENT",
      label: "Payment",
      icon: CreditCard,
      color: "hover:bg-orange-50 border-orange-200 text-orange-700",
      activeColor:
        "bg-white border-t-4 border-t-orange-500 text-orange-800 shadow-sm",
    },
    {
      id: "RECEIPT",
      label: "Receipt",
      icon: Wallet,
      color: "hover:bg-green-50 border-green-200 text-green-700",
      activeColor:
        "bg-white border-t-4 border-t-green-500 text-green-800 shadow-sm",
    },
    {
      id: "JOURNAL",
      label: "Journal",
      icon: FileText,
      color: "hover:bg-blue-50 border-blue-200 text-blue-700",
      activeColor:
        "bg-white border-t-4 border-t-blue-500 text-blue-800 shadow-sm",
    },
    {
      id: "SALES",
      label: "Sales",
      icon: ShoppingCart,
      color: "hover:bg-teal-50 border-teal-200 text-teal-700",
      activeColor:
        "bg-white border-t-4 border-t-teal-500 text-teal-800 shadow-sm",
    },
    {
      id: "PURCHASE",
      label: "Purchase",
      icon: Truck,
      color: "hover:bg-purple-50 border-purple-200 text-purple-700",
      activeColor:
        "bg-white border-t-4 border-t-purple-500 text-purple-800 shadow-sm",
    },
  ];

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
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isInventory = voucherType === "SALES" || voucherType === "PURCHASE";

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="grid grid-cols-6 gap-2 bg-slate-200 p-2 rounded-lg">
        {voucherTypes.map((v) => {
          const isActive = voucherType === v.id;
          return (
            <Link
              key={v.id}
              href={`/companies/${companyId}/vouchers/create?type=${v.id}`}
              className={clsx(
                "flex flex-col items-center justify-center p-3 rounded transition-all duration-200 border",
                isActive
                  ? v.activeColor
                  : v.color +
                      " bg-slate-100 border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <v.icon size={20} className="mb-1" />
              <span className="text-xs font-bold uppercase">{v.label}</span>
            </Link>
          );
        })}
      </div>

      {/* --- HEADER --- */}
      <div className="bg-[#003366] text-white p-4 rounded-t-sm shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {voucherType} VOUCHER
          </h1>
          <p className="text-[11px] text-blue-200 uppercase tracking-widest">
            Enter Transaction Details
          </p>
        </div>
        <div className="px-3 py-1 bg-white/10 rounded text-xs font-mono font-bold">
          FY: {new Date().getFullYear()}-
          {(new Date().getFullYear() + 1).toString().slice(-2)}
        </div>
      </div>

      {/* --- FORM CONTAINER --- */}
      <div className="bg-white p-8 border border-gray-300 shadow-sm rounded-b-sm min-h-[500px]">
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
