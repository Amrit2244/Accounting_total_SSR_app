"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Package,
  Settings,
  PieChart, // ✅ Added this import
} from "lucide-react";
import clsx from "clsx";

export default function SidebarNav({
  companyId,
  theme = "light",
}: {
  companyId: number;
  theme?: "light" | "dark" | "banking";
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard Overview",
      href: `/companies/${companyId}`,
      icon: LayoutDashboard,
      exact: true,
      code: "H001",
    },
    {
      name: "Transaction Posting",
      href: `/companies/${companyId}/vouchers`,
      icon: FileText,
      exact: false,
      code: "T050",
    },
    {
      name: "Chart of Accounts",
      href: `/companies/${companyId}/chart-of-accounts`,
      icon: BookOpen,
      exact: false,
      code: "GL10",
    },
    {
      name: "Inventory Management",
      href: `/companies/${companyId}/inventory`,
      icon: Package,
      exact: false,
      code: "INV2",
    },
    {
      name: "Financial Reports",
      href: `/companies/${companyId}/reports`,
      icon: PieChart,
      exact: false,
      code: "RPT1",
    }, // ✅ Added Reports Link
    {
      name: "System Parameters",
      href: `/companies/edit/${companyId}`,
      icon: Settings,
      exact: false,
      code: "SYS9",
    },
  ];

  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        if (theme === "banking") {
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 text-xs font-bold border-l-4 transition-colors",
                isActive
                  ? "bg-[#e6f0ff] border-[#004b8d] text-[#003366]"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              <item.icon
                size={16}
                className={isActive ? "text-[#004b8d]" : "text-gray-400"}
              />
              <div className="flex flex-col">
                <span className="leading-none">{item.name}</span>
                <span className="text-[9px] text-gray-400 font-normal mt-0.5">
                  {item.code}
                </span>
              </div>
            </Link>
          );
        }

        // Fallback for other themes (Dark/Light)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
