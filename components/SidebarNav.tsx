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
  Cpu,
  Beaker,
  Factory,
} from "lucide-react";
import clsx from "clsx";
import packageJson from "@/package.json";

export default function SidebarNav({ companyId }: { companyId: number }) {
  const pathname = usePathname();
  const appVersion = `v${packageJson.version}`;

  const menuGroups = [
    {
      label: "Main Menu",
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
      label: "Utilities & Config",
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
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 select-none">
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
              {group.label}
            </h3>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 group",
                      isActive
                        ? "bg-blue-600/10 text-white border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                        : "hover:bg-slate-800/50 hover:text-slate-100"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r-full shadow-[0_0_8px_#3b82f6]" />
                    )}
                    <item.icon
                      size={16}
                      className={clsx(
                        "transition-transform duration-200 group-hover:scale-110",
                        isActive
                          ? "text-blue-400"
                          : "text-slate-500 group-hover:text-blue-400"
                      )}
                    />
                    <span className="tracking-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1 bg-blue-500/10 rounded flex items-center justify-center">
            <Cpu size={12} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-500/20">
            <ShieldCheck size={8} /> Secure
          </div>
        </div>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">
          System Version
        </p>
        <div className="flex items-end justify-between">
          <span className="text-sm font-mono font-black text-white leading-none">
            {appVersion}
          </span>
          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
            Stable
          </span>
        </div>
      </div>
    </div>
  );
}
