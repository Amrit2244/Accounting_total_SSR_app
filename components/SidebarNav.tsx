"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Package,
  Settings,
  PieChart,
  FileUp,
  FileDown,
  Layers,
  UserCog, // Icon for Ledger Masters / Management
} from "lucide-react";
import clsx from "clsx";

export default function SidebarNav({ companyId }: { companyId: number }) {
  const pathname = usePathname();

  const navItems = [
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
      exact: false,
    },

    // --- MASTER MANAGEMENT HUB (Includes Edit & Bulk Delete Options) ---
    {
      // This link directs the user to the Ledger List page where they can see
      // individual 'Edit' buttons and 'Bulk Delete' checkboxes/options.
      name: "Ledger Masters",
      href: `/companies/${companyId}/ledgers`,
      icon: UserCog,
      exact: false,
    },

    // --- Master Structure ---
    {
      name: "Chart of Accounts",
      href: `/companies/${companyId}/chart-of-accounts`,
      icon: Layers,
      exact: false,
    },
    {
      name: "Inventory",
      href: `/companies/${companyId}/inventory`,
      icon: Package,
      exact: false,
    },
    {
      name: "Reports",
      href: `/companies/${companyId}/reports`,
      icon: PieChart,
      exact: false,
    },

    // --- DATA UTILITIES ---
    {
      name: "Import TallyData",
      href: `/companies/${companyId}/import`,
      icon: FileUp,
      exact: false,
    },
    {
      name: "Export TallyData",
      href: `/companies/${companyId}/export`,
      icon: FileDown,
      exact: false,
    },

    // --- Settings ---
    {
      name: "Settings",
      href: `/companies/edit/${companyId}`,
      icon: Settings,
      exact: false,
    },
  ];

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        // improved active state logic
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon
              size={18}
              className={clsx(
                "transition-colors",
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-white"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
