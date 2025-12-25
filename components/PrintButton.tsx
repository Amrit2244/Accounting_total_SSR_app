"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-600/20 transition-all active:scale-95 print:hidden"
    >
      <Printer size={16} />
      <span>Print Report</span>
    </button>
  );
}
