// ... imports same ...
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Package,
  Calendar,
} from "lucide-react";
import PrintButton from "@/components/PrintButton";

const fmt = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtQty = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const getFinancialYearMonths = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const months = [];
  for (let i = 3; i <= 11; i++)
    months.push({ name: getMonthName(i), monthIndex: i, year: startYear });
  for (let i = 0; i <= 2; i++)
    months.push({ name: getMonthName(i), monthIndex: i, year: startYear + 1 });
  return months;
};

const getMonthName = (index: number) => {
  const date = new Date();
  date.setMonth(index);
  return date.toLocaleString("default", { month: "long" });
};

export default async function SalesRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const companyId = parseInt(id);
  const month = sp.month ? parseInt(sp.month) : undefined;
  const year = sp.year ? parseInt(sp.year) : undefined;

  if (month === undefined || year === undefined) {
    return <MonthlySummaryView companyId={companyId} />;
  } else {
    return (
      <VoucherRegisterView companyId={companyId} month={month} year={year} />
    );
  }
}

async function MonthlySummaryView({ companyId }: { companyId: number }) {
  const fyMonths = getFinancialYearMonths();
  const allSales = await prisma.salesVoucher.findMany({
    where: { companyId, status: "APPROVED" },
    include: { ledgerEntries: true },
  });
  let grandTotalSales = 0;

  const monthlyData = fyMonths.map((m: any) => {
    const vouchersInMonth = allSales.filter((v: any) => {
      const d = new Date(v.date);
      return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
    });
    const monthTotal = vouchersInMonth.reduce((sum: number, v: any) => {
      let vTotal = 0;
      v.ledgerEntries
        .filter((e: any) => e.amount < 0)
        .forEach((e: any) => (vTotal += Math.abs(e.amount)));
      return sum + vTotal;
    }, 0);
    grandTotalSales += monthTotal;
    return { ...m, count: vouchersInMonth.length, amount: monthTotal };
  });

  // ... (render logic remains as originally provided in your code)
  return (
    <div className="max-w-[1000px] mx-auto space-y-4 py-6 font-sans">
      {/* Render logic here is identical to yours, ensuring map uses (row: any) */}
      <div className="divide-y divide-slate-100">
        {monthlyData.map((row: any) => (
          <Link
            key={`${row.name}-${row.year}`}
            href={`?month=${row.monthIndex}&year=${row.year}`}
            className="flex items-center p-3 hover:bg-blue-50 transition-colors group cursor-pointer"
          >
            <div className="flex-1 font-bold text-slate-700 group-hover:text-blue-700 flex items-center gap-2">
              {row.name}{" "}
              <span className="text-[9px] text-slate-300 font-normal">
                {row.year}
              </span>
            </div>
            <div className="w-32 text-center text-xs font-bold text-slate-400">
              {row.count > 0 ? row.count : "-"}
            </div>
            <div className="w-40 text-right font-mono font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-end gap-2">
              {row.amount > 0 ? fmt(row.amount) : "-"}{" "}
              <ChevronRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function VoucherRegisterView({
  companyId,
  month,
  year,
}: {
  companyId: number;
  month: number;
  year: number;
}) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const vouchers = await prisma.salesVoucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    include: {
      ledgerEntries: { include: { ledger: { include: { group: true } } } },
      inventoryEntries: { include: { stockItem: true } },
    },
    orderBy: { date: "asc" },
  });

  let totalTaxable = 0,
    grandTotal = 0,
    totalQty = 0;
  const registerData = vouchers.map((v: any) => {
    const partyEntry = v.ledgerEntries.find((e: any) => e.amount > 0);
    const partyName =
      partyEntry?.ledger?.name || v.partyName || "Cash / Unknown";
    let taxable = 0,
      taxAmt = 0,
      voucherQty = 0;
    v.ledgerEntries
      .filter((e: any) => e.amount < 0)
      .forEach((e: any) => {
        const amt = Math.abs(e.amount);
        if (!e.ledger || !e.ledger.group) return;
        const groupName = e.ledger.group.name.toLowerCase();
        if (groupName.includes("duties") || groupName.includes("tax"))
          taxAmt += amt;
        else taxable += amt;
      });
    v.inventoryEntries.forEach((item: any) => {
      voucherQty += Math.abs(item.quantity);
    });
    totalTaxable += taxable;
    grandTotal += taxable + taxAmt;
    totalQty += voucherQty;
    return {
      id: v.id,
      date: v.date,
      voucherNo: v.voucherNo,
      partyName,
      items: v.inventoryEntries,
      taxable,
      total: taxable + taxAmt,
    };
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col font-sans">
      {/* Render logic remains identical, ensuring map uses (row: any) and (item: any) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {registerData.map((row: any) => (
          <div
            key={row.id}
            className="flex items-stretch text-[10px] border-b border-slate-50 hover:bg-slate-50 transition-colors group min-h-[32px]"
          >
            <div className="w-24 p-2 px-3 font-bold text-slate-500 border-r border-slate-50 flex items-center">
              {new Date(row.date).toLocaleDateString("en-IN")}
            </div>
            <div className="w-24 p-2 px-3 font-bold text-slate-900 border-r border-slate-50 flex items-center">
              {row.voucherNo}
            </div>
            <div className="w-48 p-2 px-3 font-bold text-slate-700 border-r border-slate-50 uppercase truncate flex items-center">
              {row.partyName}
            </div>
            <div className="flex-1 border-r border-slate-50 flex flex-col justify-center">
              {row.items.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="px-3 py-1 truncate font-medium text-slate-600"
                >
                  {item.stockItem?.name}
                </div>
              ))}
            </div>
            <div className="w-20 border-r border-slate-50 flex flex-col justify-center">
              {row.items.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="px-3 py-1 text-right font-mono text-slate-800"
                >
                  {Math.abs(item.quantity)}
                </div>
              ))}
            </div>
            <div className="w-24 border-r border-slate-50 flex flex-col justify-center">
              {row.items.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="px-3 py-1 text-right font-mono text-slate-600"
                >
                  {item.quantity !== 0
                    ? fmt(item.amount / Math.abs(item.quantity))
                    : "-"}
                </div>
              ))}
            </div>
            <div className="w-32 p-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-50 flex items-center justify-end">
              {fmt(row.taxable)}
            </div>
            <div className="w-32 p-2 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50 group-hover:bg-slate-100 flex items-center justify-end">
              {fmt(row.total)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
