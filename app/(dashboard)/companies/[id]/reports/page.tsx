import Link from "next/link";
import { Book, PieChart, Package, ArrowRight, TrendingUp } from "lucide-react";

export default async function ReportsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reports = [
    {
      name: "Ledger Statement",
      desc: "Detailed transaction history of a specific account.",
      href: `/companies/${id}/reports/ledger`,
      icon: Book,
      color: "bg-blue-600",
    },
    {
      name: "Trial Balance",
      desc: "Summary of all account balances to ensure books are balanced.",
      href: `/companies/${id}/reports/trial-balance`,
      icon: ScaleIcon,
      color: "bg-purple-600",
    },
    {
      name: "Profit & Loss A/c",
      desc: "Statement of Net Profit/Loss for the period.",
      href: `/companies/${id}/reports/profit-loss`,
      icon: TrendingUp,
      color: "bg-teal-600", // Distinct color for P&L
    },
    {
      name: "Balance Sheet",
      desc: "Statement of Assets, Liabilities, and Capital.",
      href: `/companies/${id}/reports/balance-sheet`,
      icon: PieChart,
      color: "bg-green-600",
    },
    {
      name: "Stock Summary",
      desc: "Current inventory levels and stock value.",
      href: `/companies/${id}/reports/stock`,
      icon: Package,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#003366] border-b border-gray-300 pb-2">
        FINANCIAL REPORTS
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Link
            key={report.name}
            href={report.href}
            className="group bg-white border border-gray-300 p-6 shadow-sm hover:shadow-md transition-all flex items-start gap-4 rounded-sm hover:border-[#003366]"
          >
            <div className={`${report.color} text-white p-3 rounded shadow-sm`}>
              <report.icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#003366] transition-colors">
                {report.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
              <span className="text-xs font-bold text-blue-600 mt-3 inline-flex items-center gap-1">
                VIEW REPORT <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ScaleIcon(props: any) {
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
