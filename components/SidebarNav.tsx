"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Settings,
  PieChart,
  FileUp,
  FileDown,
  Layers,
  UserCog,
  ShieldCheck,
  Beaker,
  Factory,
  Zap,
  Users,
} from "lucide-react";
import clsx from "clsx";
import packageJson from "@/package.json";

export default function SidebarNav({ companyId }: { companyId: number }) {
  const pathname = usePathname();
  const appVersion = `v${packageJson.version}`;

  const menuGroups = [
    {
      label: "Overview",
      items: [
        {
          name: "Dashboard",
          href: `/companies/${companyId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: "Vouchers",
          href: `/companies/${companyId}/vouchers`,
          icon: FileText,
        },
        {
          name: "Reports",
          href: `/companies/${companyId}/reports`,
          icon: PieChart,
        },
      ],
    },
    {
      label: "Masters & Manufacturing",
      items: [
        {
          name: "Ledger Masters",
          href: `/companies/${companyId}/ledgers`,
          icon: UserCog,
        },
        {
          name: "Chart of Accounts",
          href: `/companies/${companyId}/chart-of-accounts`,
          icon: Layers,
        },
        {
          name: "Stock Manager",
          href: `/companies/${companyId}/inventory`,
          icon: Package,
        },
        {
          name: "Production Recipes",
          href: `/companies/${companyId}/inventory/bom`,
          icon: Beaker,
        },
        {
          name: "Manufacturing Journal",
          href: `/companies/${companyId}/vouchers/create?type=STOCK_JOURNAL`,
          icon: Factory,
        },
      ],
    },
    {
      label: "Utilities & System",
      items: [
        {
          name: "Import Data",
          href: `/companies/${companyId}/import`,
          icon: FileUp,
        },
        {
          name: "Export Data",
          href: `/companies/${companyId}/export`,
          icon: FileDown,
        },
        {
          name: "Verification",
          href: `/companies/${companyId}/verify`,
          icon: ShieldCheck,
        },
        {
          name: "Settings",
          href: `/companies/${companyId}/edit`,
          icon: Settings,
        },
        {
          name: "User Management",
          href: `/admin`,
          icon: Users,
        },
      ],
    },
  ];

  return (
    <div className="px-4 space-y-8 select-none py-6">
      {menuGroups.map((group, idx) => (
        <div key={idx}>
          {/* Group Label */}
          <h3 className="px-4 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400/80">
            {group.label}
          </h3>

          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {/* Active Indicator Line (Left) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <item.icon
                    size={18}
                    className={clsx(
                      "transition-colors duration-300",
                      isActive
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />

                  <span>{item.name}</span>

                  {/* Subtle Glow on Hover */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-current opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* --- SYSTEM CARD --- */}
      <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Zap size={40} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-1">System Version</p>
          <p className="text-xl font-mono font-bold">{appVersion}</p>
        </div>
      </div>
    </div>
  );
}
