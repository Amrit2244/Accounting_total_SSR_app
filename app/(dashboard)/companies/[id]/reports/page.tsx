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
  ShieldCheck, // Added for Audit branding
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
  colorClass: string;
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
      desc: "Detailed transaction history & running balance for all accounts.",
      href: `/companies/${companyId}/reports/ledger`,
      icon: Book,
      colorClass: "bg-blue-600 shadow-blue-200",
    },
    {
      name: "Sales Register",
      desc: "Monthly sales summary with Taxable & Tax breakdown.",
      href: `/companies/${companyId}/reports/sales-register`,
      icon: BookOpen,
      colorClass: "bg-indigo-600 shadow-indigo-200",
    },
    {
      name: "Trial Balance",
      desc: "Group-wise summary of consolidated Dr/Cr balances.",
      href: `/companies/${companyId}/reports/trial-balance`,
      icon: ScaleIcon,
      colorClass: "bg-purple-600 shadow-purple-200",
    },
    {
      name: "Profit & Loss A/c",
      desc: "Gross & Net Profit analysis with Trading account data.",
      href: `/companies/${companyId}/reports/profit-loss`,
      icon: TrendingUp,
      colorClass: "bg-teal-600 shadow-teal-200",
    },
    {
      name: "Balance Sheet",
      desc: "Snapshot of Assets, Liabilities, and Equity position.",
      href: `/companies/${companyId}/reports/balance-sheet`,
      icon: PieChart,
      colorClass: "bg-emerald-600 shadow-emerald-200",
    },
    {
      name: "Stock Summary",
      desc: "Real-time inventory valuation via Weighted Average method.",
      href: `/companies/${companyId}/reports/stock-summary`,
      icon: Package,
      colorClass: "bg-orange-600 shadow-orange-200",
    },
    {
      name: "Daybook Register",
      desc: "Chronological log of all finalized financial transactions.",
      href: `/companies/${companyId}/reports/daybook`,
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowRight size={18} className="rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
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
                <span className="text-slate-900">Analysis Hub</span>
              </div>
            </div>
          </div>

          {/* Audit Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-tighter">
              Verified Ledger Engine Active
            </span>
          </div>
        </div>

        {/* REPORTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <Link
              key={report.name}
              href={report.href}
              className="group relative bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300 flex flex-col gap-4 overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -mr-12 -mt-12 transition-all duration-500 group-hover:bg-indigo-50 group-hover:scale-110" />

              <div className="flex items-start gap-4 z-10">
                <div
                  className={`p-3 rounded-xl text-white shadow-lg shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ${report.colorClass}`}
                >
                  <report.icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {report.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    {report.desc}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between z-10">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-300 transition-colors">
                  SECURE-KERNEL-v1.2
                </span>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Open <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Audit Footnote */}
        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-slate-100" />
            Reporting reflects APPROVED transactions only
            <span className="w-8 h-px bg-slate-100" />
          </p>
        </div>
      </div>
    </div>
  );
}
