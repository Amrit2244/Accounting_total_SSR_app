import Link from "next/link";
import {
  Book,
  PieChart,
  Package,
  ArrowRight,
  TrendingUp,
  Scale,
  FolderOpen,
  FileText,
} from "lucide-react";
import { notFound } from "next/navigation";

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2v2" />
      <path d="M17 7h2v2" />
    </svg>
  );
}

type Report = {
  name: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  color: string;
};

export default async function ReportsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  const reports: Report[] = [
    {
      name: "Ledger Explorer",
      desc: "Detailed transaction history & running balance.",
      href: `/companies/${companyId}/reports/ledger`,
      icon: Book,
      color: "bg-blue-600",
    },
    {
      name: "Trial Balance",
      desc: "Consolidated debit/credit balances.",
      href: `/companies/${companyId}/reports/trial-balance`,
      icon: ScaleIcon,
      color: "bg-purple-600",
    },
    {
      name: "Profit & Loss A/c",
      desc: "Income vs Expenses & Net Profit analysis.",
      href: `/companies/${companyId}/reports/profit-loss`,
      icon: TrendingUp,
      color: "bg-teal-600",
    },
    {
      name: "Balance Sheet",
      desc: "Financial position: Assets vs Liabilities.",
      href: `/companies/${companyId}/reports/balance-sheet`,
      icon: PieChart,
      color: "bg-emerald-600",
    },
    {
      name: "Stock Summary",
      desc: "Inventory valuation & closing stock.",
      href: `/companies/${companyId}/reports/stock-summary`,
      icon: Package,
      color: "bg-orange-600",
    },
    {
      name: "Daybook Register",
      desc: "Chronological daily transaction log.",
      href: `/companies/${companyId}/vouchers`, // Usually reuses the voucher list
      icon: FolderOpen,
      color: "bg-pink-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      {/* COMPACT HEADER */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-slate-900 rounded-lg text-white shadow-md">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Financial Reports
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Audit & Performance Analytics
          </p>
        </div>
      </div>

      {/* COMPACT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Link
            key={report.name}
            href={report.href}
            className="group bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex items-start gap-3 relative overflow-hidden"
          >
            {/* Hover Effect Background */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -mr-8 -mt-8 transition-colors group-hover:bg-blue-50" />

            <div
              className={`${report.color} text-white p-2.5 rounded-lg shadow-sm shrink-0 z-10 group-hover:scale-110 transition-transform`}
            >
              <report.icon size={18} />
            </div>

            <div className="flex-1 z-10">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                {report.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                {report.desc}
              </p>
            </div>

            <ArrowRight
              size={14}
              className="text-slate-300 absolute bottom-4 right-4 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
