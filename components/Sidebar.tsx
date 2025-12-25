"use client";

import { logout } from "@/app/actions/auth";
import SidebarNav from "./SidebarNav";
import { LogOut, Hexagon } from "lucide-react";

export default function Sidebar({ companyId }: { companyId: number }) {
  return (
    <aside className="relative w-72 min-h-screen flex flex-col z-20 transition-all duration-300 group">
      {/* BACKGROUND LAYER 
         - Light Mode: Crisp White with subtle gray gradient
         - Dark Mode: Deep Space Black with a blue glow at the bottom
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 dark:from-[#0B1120] dark:to-[#0f172a] border-r border-slate-200/60 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/50" />

      {/* GLOW EFFECT (Dark Mode Only) */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-indigo-500/10 blur-[80px] pointer-events-none opacity-0 dark:opacity-100" />

      {/* --- HEADER --- */}
      <div className="relative h-20 flex items-center px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <Hexagon size={20} className="fill-current" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-slate-800 dark:text-white leading-none">
              AS CORE
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* --- NAV SCROLL AREA --- */}
      <div className="relative flex-1 overflow-y-auto py-4 z-10 scrollbar-hide">
        <SidebarNav companyId={companyId} />
      </div>

      {/* --- FOOTER --- */}
      <div className="relative p-6 z-10 border-t border-slate-100 dark:border-white/5">
        <form action={logout}>
          <button className="w-full relative overflow-hidden group flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900/50">
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
