"use client";

import { Printer, ArrowLeft } from "lucide-react";

export default function PrintTriggerButton() {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-slate-700"
      >
        <Printer size={14} /> Print Document
      </button>
      <button
        onClick={() => window.history.back()}
        className="bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-black text-[10px] uppercase shadow-md flex items-center gap-2 transition-all border border-slate-200"
      >
        <ArrowLeft size={14} /> Back
      </button>
    </div>
  );
}
