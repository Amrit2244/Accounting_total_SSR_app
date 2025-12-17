import Link from "next/link";
import {
  Book,
  PieChart,
  Package,
  ArrowRight,
  TrendingUp,
  Scale,
  FolderOpen,
} from "lucide-react";
import { notFound } from "next/navigation";

// Utility component for the Scale/Trial Balance icon
function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  // Reusing the correct path for ScaleIcon
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

// Define the Report Card Structure
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
      name: "Ledger Statement",
      desc: "Detailed transaction history of a specific account (e.g., Bank, Party, Expense).",
      href: `/companies/${companyId}/reports/ledger`,
      icon: Book,
      color: "bg-blue-600",
    },
    {
      name: "Trial Balance",
      desc: "Summary of all debit and credit account balances to ensure books are balanced.",
      href: `/companies/${companyId}/reports/trial-balance`,
      icon: ScaleIcon,
      color: "bg-purple-600",
    },
    {
      name: "Profit & Loss A/c",
      desc: "Statement calculating Net Profit/Loss by summarizing revenue and expenses.",
      href: `/companies/${companyId}/reports/profit-loss`,
      icon: TrendingUp,
      color: "bg-teal-600",
    },
    {
      name: "Balance Sheet",
      desc: "Statement of Assets, Liabilities, and Capital at a specific point in time.",
      href: `/companies/${companyId}/reports/balance-sheet`,
      icon: PieChart,
      color: "bg-green-600",
    },
    {
      name: "Stock Summary",
      desc: "Current inventory levels, including quantity and total value of stock.",
      href: `/companies/${companyId}/reports/stock`,
      icon: Package,
      color: "bg-orange-600",
    },
    {
      name: "Journal Book / Daybook",
      desc: "Chronological listing of all financial transactions recorded on a particular day.",
      href: `/companies/${companyId}/reports/journal`,
      icon: FolderOpen,
      color: "bg-pink-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          Financial & Inventory Reports
        </h1>
        <p className="text-slate-500 mt-2">
          Select a report to analyze your company's financial performance and
          position.
        </p>
      </div>

      {/* REPORTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link
            key={report.name}
            href={report.href}
            className="group bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-start gap-4 rounded-xl hover:border-blue-300"
          >
            {/* Icon Circle */}
            <div
              className={`${report.color} text-white p-3 rounded-full shadow-md shadow-slate-300/50 transition-all group-hover:scale-[1.05]`}
            >
              <report.icon size={24} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {report.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{report.desc}</p>

              <span className="text-xs font-bold text-blue-600 mt-3 inline-flex items-center gap-1 transition-transform group-hover:translate-x-1">
                VIEW REPORT <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
