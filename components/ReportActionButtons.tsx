"use client";

import { Printer } from "lucide-react";

export default function ReportActionButtons() {
  return (
    <div className="flex gap-2 no-print">
      <button
        onClick={() => window.print()}
        className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors"
      >
        <Printer size={16} /> Print Report
      </button>
    </div>
  );
}
