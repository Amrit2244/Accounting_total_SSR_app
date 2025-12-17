"use client";

import { logout } from "@/app/actions/auth";
import SidebarNav from "./SidebarNav";
import { LogOut, Activity } from "lucide-react";

export default function Sidebar({ companyId }: { companyId: number }) {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 shadow-xl z-20">
      {/* HEADER / LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="p-1.5 bg-blue-600 rounded-md shadow-lg shadow-blue-600/20">
            <Activity size={18} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            FinCore
          </span>
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* We pass the companyId down to the nav */}
        <SidebarNav companyId={companyId} />
      </div>

      {/* FOOTER / LOGOUT */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <form action={logout}>
          <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <LogOut
              size={18}
              className="group-hover:text-red-400 transition-colors"
            />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
