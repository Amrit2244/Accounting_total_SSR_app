import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  TrendingUp,
} from "lucide-react";

// --- Formatters ---
const fmt = (v: number) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: "INR",
  });

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

// --------------------------------------------------------------------------
// VIEW 1: MONTHLY SUMMARY (Dynamically generated from Data)
// --------------------------------------------------------------------------
async function MonthlySummaryView({ companyId }: { companyId: number }) {
  // 1. Fetch ALL Sales Vouchers (optimized select)
  const allSales = await prisma.salesVoucher.findMany({
    where: { companyId, status: "APPROVED" },
    select: {
      date: true,
      totalAmount: true, // Use the total amount stored in the header
    },
    orderBy: { date: "desc" },
  });

  // 2. Group by Month-Year dynamically
  const groupedData = allSales.reduce((acc: any, v) => {
    const d = new Date(v.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`; // e.g. "2023-3"

    if (!acc[key]) {
      acc[key] = {
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        name: d.toLocaleString("default", { month: "long" }),
        count: 0,
        amount: 0,
      };
    }

    acc[key].count += 1;
    acc[key].amount += v.totalAmount || 0;
    return acc;
  }, {});

  // 3. Sort Chronologically (Newest First)
  const monthlyData = Object.values(groupedData).sort((a: any, b: any) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.monthIndex - a.monthIndex;
  });

  const totalSales = allSales.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} /> Sales Register
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monthly summary of all recorded sales transactions.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Grand Total Sales
            </p>
            <p className="text-lg font-black text-emerald-600">
              {fmt(totalSales)}
            </p>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {monthlyData.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Filter className="mx-auto mb-3 opacity-50" size={48} />
              <p>No Sales Vouchers found in the database.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {monthlyData.map((row: any) => (
                <Link
                  key={`${row.name}-${row.year}`}
                  href={`?month=${row.monthIndex}&year=${row.year}`}
                  className="flex items-center p-4 hover:bg-blue-50/50 transition-all group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-700 text-sm group-hover:text-blue-700">
                      {row.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {row.year}
                    </p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Vouchers
                    </p>
                    <p className="font-mono font-bold text-slate-700">
                      {row.count}
                    </p>
                  </div>
                  <div className="text-right w-32">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Amount
                    </p>
                    <p className="font-mono font-black text-slate-900 group-hover:text-blue-700">
                      {fmt(row.amount)}
                    </p>
                  </div>
                  <div className="ml-4 text-slate-300 group-hover:text-blue-500">
                    <ChevronRight size={20} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// VIEW 2: DETAILED VOUCHER REGISTER
// --------------------------------------------------------------------------
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
  endDate.setHours(23, 59, 59, 999);

  const vouchers = await prisma.salesVoucher.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    include: {
      // Deep include to detect Tax vs Sales ledgers
      ledgerEntries: {
        include: {
          ledger: {
            include: { group: true },
          },
        },
      },
      inventoryEntries: {
        include: { stockItem: true },
      },
    },
    orderBy: { date: "desc" },
  });

  let totalTaxable = 0;
  let totalTax = 0;
  let totalGrand = 0;

  const registerData = vouchers.map((v: any) => {
    // 1. Identify Party (Debit Side / Negative in DB)
    const partyEntry = v.ledgerEntries.find((e: any) => e.amount < 0);
    const partyName =
      partyEntry?.ledger?.name || v.partyName || "Cash / Unknown";

    // 2. Calculate Split (Taxable vs Tax) from Credit Side (Positive in DB)
    let taxable = 0;
    let taxAmt = 0;

    v.ledgerEntries
      .filter((e: any) => e.amount > 0) // Look at Credits
      .forEach((e: any) => {
        const amt = e.amount;
        const grpName = e.ledger?.group?.name?.toLowerCase() || "";
        const ledName = e.ledger?.name?.toLowerCase() || "";

        // Heuristic: If group is 'duties & taxes' OR name contains 'gst'/'tax'
        if (
          grpName.includes("duties") ||
          grpName.includes("tax") ||
          ledName.includes("gst") ||
          ledName.includes("tax") ||
          ledName.includes("duty")
        ) {
          taxAmt += amt;
        } else {
          // Otherwise, it's likely a Sales Account (Taxable Value)
          taxable += amt;
        }
      });

    // If Credit side is empty (e.g. inventory only mode), fallback to totalAmount as taxable
    if (taxable === 0 && taxAmt === 0) {
      taxable = v.totalAmount;
    }

    const voucherTotal = taxable + taxAmt;

    totalTaxable += taxable;
    totalTax += taxAmt;
    totalGrand += voucherTotal;

    return {
      id: v.id,
      date: v.date,
      voucherNo: v.voucherNo,
      partyName,
      items: v.inventoryEntries,
      taxable,
      tax: taxAmt,
      total: voucherTotal,
    };
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 font-sans">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="?"
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {new Date(year, month).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {registerData.length} Vouchers Found
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Total Taxable
            </p>
            <p className="font-mono font-bold text-slate-700">
              {fmt(totalTaxable)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Total Tax
            </p>
            <p className="font-mono font-bold text-slate-700">
              {fmt(totalTax)}
            </p>
          </div>
          <div className="bg-slate-900 text-white px-3 py-1 rounded">
            <p className="text-[10px] font-bold opacity-70 uppercase">
              Grand Total
            </p>
            <p className="font-mono font-bold">{fmt(totalGrand)}</p>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-[1000px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 w-28">
                  Date
                </th>
                <th className="px-4 py-3 border-b border-slate-200 w-24">
                  Vch No
                </th>
                <th className="px-4 py-3 border-b border-slate-200 w-64">
                  Party Name
                </th>
                <th className="px-4 py-3 border-b border-slate-200">
                  Item Details
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-right w-32">
                  Taxable
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-right w-24">
                  Tax
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-right w-32 bg-slate-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registerData.map((row: any) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-slate-600 align-top">
                    {new Date(row.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 align-top">
                    #{row.voucherNo}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 align-top truncate max-w-[200px]">
                    {row.partyName}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.items.length > 0 ? (
                      <div className="space-y-1">
                        {row.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-slate-600 truncate max-w-[150px]">
                              {item.stockItem?.name}
                            </span>
                            <span className="font-mono text-slate-400">
                              {Math.abs(item.quantity)} x {item.rate}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">
                        - Account Only -
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 align-top">
                    {fmt(row.taxable)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs align-top">
                    {row.tax > 0 ? fmt(row.tax) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50 align-top">
                    {fmt(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
