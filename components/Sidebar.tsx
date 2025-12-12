"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Vouchers", href: "/vouchers" },
  { name: "Ledgers", href: "/ledgers" },
  { name: "Reports", href: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-slate-700">
        AcctApp
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <form action={logout}>
          <button className="w-full text-left px-4 py-2 hover:bg-red-600 rounded text-red-200 hover:text-white transition">
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
