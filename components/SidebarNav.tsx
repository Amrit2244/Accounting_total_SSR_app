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
} from "lucide-react";
import clsx from "clsx";
import packageJson from "@/package.json"; // Import the file

export default function SidebarNav({ companyId }: { companyId: number }) {
  const pathname = usePathname();
  const appVersion = `v${packageJson.version}`; // Update this per release

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
      label: "Masters",
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
          name: "Inventory",
          href: `/companies/${companyId}/inventory`,
          icon: Package,
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
          name: "Settings",
          href: `/companies/edit/${companyId}`,
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 select-none">
      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-60">
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
                      "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group",
                      isActive
                        ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                        : "hover:bg-slate-800/50 hover:text-slate-100"
                    )}
                  >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
                    )}

                    <item.icon
                      size={20}
                      className={clsx(
                        "transition-all duration-300 group-hover:scale-110",
                        isActive
                          ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
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

      {/* Modern Version Footer */}
      <div className="p-4 mx-4 mb-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Cpu size={14} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            <ShieldCheck size={10} />
            Secure
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-medium mb-1">
          Application Version
        </p>
        <div className="flex items-end justify-between">
          <span className="text-lg font-mono font-black text-white leading-none">
            {appVersion}
          </span>
          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest italic">
            Stable Branch
          </span>
        </div>
      </div>
    </div>
  );
}
