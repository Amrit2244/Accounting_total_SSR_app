import { prisma } from "@/lib/prisma";
import VoucherForm from "@/components/forms/VoucherForm";
import SalesPurchaseForm from "@/components/forms/SalesPurchaseForm";
import StockJournalForm from "@/components/forms/StockJournalForm";
import Link from "next/link";
import clsx from "clsx";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  FileText,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  ShoppingCart,
  Truck,
  ArrowLeft,
  ChevronRight,
  Factory,
  FilePlus,
} from "lucide-react";

// Helper to get user role for Admin Bypass logic
async function getIsAdmin() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return false;

    const { payload } = await jwtVerify(
      session,
      new TextEncoder().encode(process.env.SESSION_SECRET)
    );
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

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

  // 1. Get Admin status for prop drilling
  const isAdmin = await getIsAdmin();

  const voucherTypes = [
    {
      id: "CONTRA",
      label: "Contra",
      icon: ArrowLeftRight,
      activeColor: "bg-slate-700",
      iconColor: "text-slate-400",
    },
    {
      id: "PAYMENT",
      label: "Payment",
      icon: CreditCard,
      activeColor: "bg-orange-600",
      iconColor: "text-orange-500",
    },
    {
      id: "RECEIPT",
      label: "Receipt",
      icon: Wallet,
      activeColor: "bg-emerald-600",
      iconColor: "text-emerald-500",
    },
    {
      id: "JOURNAL",
      label: "Journal",
      icon: FileText,
      activeColor: "bg-blue-600",
      iconColor: "text-blue-500",
    },
    {
      id: "SALES",
      label: "Sales",
      icon: ShoppingCart,
      activeColor: "bg-teal-600",
      iconColor: "text-teal-500",
    },
    {
      id: "PURCHASE",
      label: "Purchase",
      icon: Truck,
      activeColor: "bg-purple-600",
      iconColor: "text-purple-500",
    },
    {
      id: "STOCK_JOURNAL",
      label: "Manufacturing",
      icon: Factory,
      activeColor: "bg-rose-600",
      iconColor: "text-rose-500",
    },
  ];

  const currentVoucher =
    voucherTypes.find((v) => v.id === voucherType) || voucherTypes[3];

  // 2. Fetch Ledgers with explicit group inclusion
  // This ensures the Client Components can filter by group name (e.g., 'Sundry Debtors')
  const rawLedgers = await prisma.ledger.findMany({
    where: { companyId },
    include: {
      group: {
        select: { name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const ledgers = rawLedgers.map((l: any) => ({
    ...l,
    group: l.group || { name: "General" },
  }));

  // 3. Fetch Stock Items for Sales/Purchase/Manufacturing
  const items = await prisma.stockItem.findMany({
    where: { companyId },
    select: { id: true, name: true, gstRate: true },
    orderBy: { name: "asc" },
  });

  const isInventory = voucherType === "SALES" || voucherType === "PURCHASE";
  const isStockJournal = voucherType === "STOCK_JOURNAL";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <Link
                href={`/companies/${companyId}`}
                className="hover:text-indigo-600 transition-colors"
              >
                Workspace
              </Link>
              <ChevronRight size={10} />
              <Link
                href={`/companies/${companyId}/vouchers`}
                className="hover:text-indigo-600 transition-colors"
              >
                Daybook
              </Link>
              <ChevronRight size={10} />
              <span className="text-slate-900">New Entry</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <FilePlus className="text-indigo-600" size={32} />
              Create Voucher
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Record a new {currentVoucher.label.toLowerCase()} transaction.
            </p>
          </div>

          <Link
            href={`/companies/${companyId}/vouchers`}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
        </div>

        {/* VOUCHER TYPE SELECTOR */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {voucherTypes.map((v) => {
            const isActive = voucherType === v.id;
            return (
              <Link
                key={v.id}
                href={`?type=${v.id}`}
                className={clsx(
                  "flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 border",
                  isActive
                    ? `${v.activeColor} border-transparent text-white shadow-lg shadow-slate-300 scale-105 z-10`
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5"
                )}
              >
                <v.icon
                  size={18}
                  className={clsx(
                    "mb-1.5",
                    isActive ? "text-white" : v.iconColor
                  )}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {v.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible relative min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-2xl" />

          <div className="p-1">
            {isStockJournal ? (
              <StockJournalForm
                companyId={companyId}
                stockItems={items}
                isAdmin={isAdmin}
              />
            ) : isInventory ? (
              <SalesPurchaseForm
                companyId={companyId}
                type={voucherType}
                ledgers={ledgers}
                items={items}
                isAdmin={isAdmin}
              />
            ) : (
              <VoucherForm
                companyId={companyId}
                ledgers={ledgers}
                defaultType={voucherType}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
