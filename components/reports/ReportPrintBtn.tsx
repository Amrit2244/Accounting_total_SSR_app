"use client";

import { Printer } from "lucide-react";

export default function ReportPrintBtn() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-all border border-blue-100 px-3 py-1.5 rounded-lg bg-blue-50/50 print:hidden"
    >
      <Printer size={14} /> Print Report
    </button>
  );
}
