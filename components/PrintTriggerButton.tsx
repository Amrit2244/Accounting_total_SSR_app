"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrintTriggerButton() {
  const router = useRouter();

  return (
    <div className="flex gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
      >
        <Printer size={16} />
        <span>Print Document</span>
      </button>

      <button
        onClick={() => router.back()}
        className="bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm border border-slate-200 flex items-center gap-2 transition-all active:scale-95"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>
    </div>
  );
}
