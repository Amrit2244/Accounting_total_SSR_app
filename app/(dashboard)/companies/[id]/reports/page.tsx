import Link from "next/link";
import {
  Book,
  PieChart,
  Package,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  FileText,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { notFound } from "next/navigation";

// Custom Scale Icon for Trial Balance
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
  colorClass: string; // Changed to colorClass for Tailwind classes
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
      colorClass: "bg-blue-600 shadow-blue-200",
    },
    {
      name: "Sales Register",
      desc: "Monthly sales summary & detailed breakdown.",
      href: `/companies/${companyId}/reports/sales-register`,
      icon: BookOpen,
      colorClass: "bg-indigo-600 shadow-indigo-200",
    },
    {
      name: "Trial Balance",
      desc: "Consolidated debit/credit balances.",
      href: `/companies/${companyId}/reports/trial-balance`,
      icon: ScaleIcon,
      colorClass: "bg-purple-600 shadow-purple-200",
    },
    {
      name: "Profit & Loss A/c",
      desc: "Income vs Expenses & Net Profit analysis.",
      href: `/companies/${companyId}/reports/profit-loss`,
      icon: TrendingUp,
      colorClass: "bg-teal-600 shadow-teal-200",
    },
    {
      name: "Balance Sheet",
      desc: "Financial position: Assets vs Liabilities.",
      href: `/companies/${companyId}/reports/balance-sheet`,
      icon: PieChart,
      colorClass: "bg-emerald-600 shadow-emerald-200",
    },
    {
      name: "Stock Summary",
      desc: "Inventory valuation & closing stock.",
      href: `/companies/${companyId}/reports/stock-summary`,
      icon: Package,
      colorClass: "bg-orange-600 shadow-orange-200",
    },
    {
      name: "Daybook Register",
      desc: "Chronological daily transaction log.",
      href: `/companies/${companyId}/reports/daybook`, // Adjusted href to point to reports daybook if distinct
      icon: FolderOpen,
      colorClass: "bg-rose-600 shadow-rose-200",
    },
  ];

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

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowRight size={18} className="rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileText size={22} className="text-indigo-600" />
                Financial Reports
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href={`/companies/${companyId}`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">Reports Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* REPORTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <Link
              key={report.name}
              href={report.href}
              className="group relative bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex items-start gap-4 overflow-hidden"
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[3rem] -mr-10 -mt-10 transition-colors group-hover:bg-indigo-50/50" />

              <div
                className={`p-3 rounded-xl text-white shadow-lg shrink-0 z-10 group-hover:scale-110 transition-transform duration-300 ${report.colorClass}`}
              >
                <report.icon size={20} />
              </div>

              <div className="flex-1 z-10">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                  {report.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {report.desc}
                </p>

                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  View Report <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
