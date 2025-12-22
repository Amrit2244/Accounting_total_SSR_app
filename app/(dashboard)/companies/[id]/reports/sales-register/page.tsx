import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Package,
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

// --- HELPER: GENERATE FINANCIAL YEAR MONTHS ---
const getFinancialYearMonths = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  const months = [];
  for (let i = 3; i <= 11; i++) {
    months.push({ name: getMonthName(i), monthIndex: i, year: startYear });
  }
  for (let i = 0; i <= 2; i++) {
    months.push({ name: getMonthName(i), monthIndex: i, year: startYear + 1 });
  }
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
  const sp = await searchParams; // Await searchParams
  const companyId = parseInt(id);

  const month = sp.month ? parseInt(sp.month) : undefined;
  const year = sp.year ? parseInt(sp.year) : undefined;

  const isMonthlyView = month === undefined || year === undefined;

  if (isMonthlyView) {
    return <MonthlySummaryView companyId={companyId} />;
  } else {
    return (
      <VoucherRegisterView companyId={companyId} month={month!} year={year!} />
    );
  }
}

// ============================================================================
// VIEW 1: MONTHLY SUMMARY
// ============================================================================
async function MonthlySummaryView({ companyId }: { companyId: number }) {
  const fyMonths = getFinancialYearMonths();

  // ✅ FIX: Query 'salesVoucher' instead of 'voucher'
  // Use 'ledgerEntries' instead of 'entries'
  const allSales = await prisma.salesVoucher.findMany({
    where: { companyId, status: "APPROVED" },
    include: { ledgerEntries: true },
  });

  let grandTotalSales = 0;

  const monthlyData = fyMonths.map((m) => {
    const vouchersInMonth = allSales.filter((v) => {
      const d = new Date(v.date);
      return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
    });

    const monthTotal = vouchersInMonth.reduce((sum, v) => {
      // ✅ FIX: Access 'ledgerEntries'
      // Sales Logic: Credit amounts (negative) are usually the Income/Sales values
      // We sum absolute values of negative entries to get total sales value
      let vTotal = 0;
      v.ledgerEntries
        .filter((e) => e.amount < 0)
        .forEach((e) => (vTotal += Math.abs(e.amount)));
      return sum + vTotal;
    }, 0);

    grandTotalSales += monthTotal;

    return { ...m, count: vouchersInMonth.length, amount: monthTotal };
  });

  return (
    <div className="max-w-[1000px] mx-auto space-y-4 animate-in fade-in duration-500 py-6 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <Calendar size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Sales Register
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Monthly Summary
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${companyId}/reports`}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center p-3">
          <div className="flex-1">Particulars (Month)</div>
          <div className="w-32 text-center">Vouchers</div>
          <div className="w-40 text-right">Credit (Sales)</div>
        </div>
        <div className="divide-y divide-slate-100">
          {monthlyData.map((row) => (
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
                {row.amount > 0 ? fmt(row.amount) : "-"}
                <ChevronRight
                  size={12}
                  className="text-slate-300 group-hover:text-blue-400"
                />
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-slate-100 border-t border-slate-200 flex items-center p-3 text-xs font-black uppercase">
          <div className="flex-1 text-right pr-4 text-slate-500">
            Grand Total
          </div>
          <div className="w-40 text-right font-mono text-slate-900">
            {fmt(grandTotalSales)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 2: VOUCHER REGISTER (Detailed View with Inventory & Totals)
// ============================================================================
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

  // ✅ FIX: Query 'salesVoucher'
  const vouchers = await prisma.salesVoucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    // ✅ FIX: Update relation names
    include: {
      ledgerEntries: { include: { ledger: { include: { group: true } } } },
      inventoryEntries: { include: { stockItem: true } },
    },
    orderBy: { date: "asc" },
  });

  // Aggregation vars
  let totalTaxable = 0;
  let grandTotal = 0;
  let totalQty = 0;

  const registerData = vouchers.map((v) => {
    // Sales Logic: Party is usually debited (Positive amount)
    const partyEntry = v.ledgerEntries.find((e) => e.amount > 0);
    const partyName =
      partyEntry?.ledger?.name || v.partyName || "Cash / Unknown";

    let taxable = 0;
    let taxAmt = 0;
    let voucherQty = 0;

    // Financial Totals
    // Sales logic: Credit entries (negative) are Sales + Tax
    v.ledgerEntries
      .filter((e) => e.amount < 0)
      .forEach((e) => {
        const amt = Math.abs(e.amount);

        if (!e.ledger || !e.ledger.group) return;

        const groupName = e.ledger.group.name.toLowerCase();
        if (groupName.includes("duties") || groupName.includes("tax")) {
          taxAmt += amt;
        } else {
          taxable += amt; // Assuming non-tax credits are Sales
        }
      });

    // Quantity Totals
    v.inventoryEntries.forEach((item) => {
      voucherQty += Math.abs(item.quantity); // Inventory in Sales is usually negative (outward), so use Abs
    });

    totalTaxable += taxable;
    const rowTotal = taxable + taxAmt;
    grandTotal += rowTotal;
    totalQty += voucherQty;

    return {
      id: v.id,
      date: v.date,
      voucherNo: v.voucherNo,
      partyName,
      items: v.inventoryEntries, // Use updated field name
      taxable,
      total: rowTotal,
    };
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Sales Register
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {startDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton />
          <Link
            href={`/companies/${companyId}/reports/sales-register`}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Summary
          </Link>
        </div>
      </div>

      {/* REGISTER TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        {/* Table Head */}
        <div className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center shrink-0">
          <div className="w-24 p-3 border-r border-slate-700">Date</div>
          <div className="w-24 p-3 border-r border-slate-700">Vch No.</div>
          <div className="w-48 p-3 border-r border-slate-700">Particulars</div>

          <div className="flex-1 p-3 border-r border-slate-700 flex gap-2">
            <Package size={12} className="text-slate-400" />
            Item Details
          </div>
          <div className="w-20 p-3 text-right border-r border-slate-700">
            Qty
          </div>
          <div className="w-24 p-3 text-right border-r border-slate-700">
            Rate
          </div>

          <div className="w-32 p-3 text-right border-r border-slate-700">
            Taxable Val
          </div>
          <div className="w-32 p-3 text-right bg-slate-800">Total Amt</div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {registerData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              No sales found
            </div>
          ) : (
            registerData.map((row) => (
              <div
                key={row.id}
                className="flex items-stretch text-[10px] border-b border-slate-50 hover:bg-slate-50 transition-colors group min-h-[32px]"
              >
                {/* VOUCHER DETAILS */}
                <div className="w-24 p-2 px-3 font-bold text-slate-500 border-r border-slate-50 flex items-center">
                  {new Date(row.date).toLocaleDateString("en-IN")}
                </div>
                <div className="w-24 p-2 px-3 font-bold text-slate-900 border-r border-slate-50 flex items-center">
                  {row.voucherNo}
                </div>
                <div className="w-48 p-2 px-3 font-bold text-slate-700 border-r border-slate-50 uppercase truncate flex items-center">
                  {row.partyName}
                </div>

                {/* INVENTORY */}
                <div className="flex-1 border-r border-slate-50 flex flex-col justify-center">
                  {row.items.length > 0 ? (
                    row.items.map((item: any, idx: number) => (
                      <div
                        key={item.id}
                        className={`px-3 py-1 truncate font-medium text-slate-600 ${
                          idx !== row.items.length - 1
                            ? "border-b border-slate-50/50"
                            : ""
                        }`}
                      >
                        {item.stockItem?.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-1 text-slate-300 italic">
                      No Items
                    </div>
                  )}
                </div>
                <div className="w-20 border-r border-slate-50 flex flex-col justify-center">
                  {row.items.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className={`px-3 py-1 text-right font-mono text-slate-800 ${
                        idx !== row.items.length - 1
                          ? "border-b border-slate-50/50"
                          : ""
                      }`}
                    >
                      {Math.abs(item.quantity)}
                    </div>
                  ))}
                </div>
                <div className="w-24 border-r border-slate-50 flex flex-col justify-center">
                  {row.items.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className={`px-3 py-1 text-right font-mono text-slate-600 ${
                        idx !== row.items.length - 1
                          ? "border-b border-slate-50/50"
                          : ""
                      }`}
                    >
                      {item.quantity !== 0
                        ? fmt(item.amount / Math.abs(item.quantity))
                        : "-"}
                    </div>
                  ))}
                </div>

                {/* FINANCIALS */}
                <div className="w-32 p-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-50 flex items-center justify-end">
                  {fmt(row.taxable)}
                </div>
                <div className="w-32 p-2 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50 group-hover:bg-slate-100 flex items-center justify-end">
                  {fmt(row.total)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 flex items-center text-[10px] font-black uppercase tracking-tight shrink-0">
          <div className="w-[calc(96px+96px+192px)] p-3 text-right text-slate-500">
            Total
          </div>
          <div className="flex-1 border-l border-slate-200" />
          <div className="w-20 p-3 text-right border-l border-slate-200 font-mono text-blue-700">
            {fmtQty(totalQty)}
          </div>
          <div className="w-24 border-l border-slate-200" />{" "}
          <div className="w-32 p-3 text-right border-l border-slate-200">
            {fmt(totalTaxable)}
          </div>
          <div className="w-32 p-3 text-right bg-slate-900 text-white font-mono text-xs">
            {fmt(grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
