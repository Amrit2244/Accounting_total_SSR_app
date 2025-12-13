"use client";

import { Printer, ArrowLeft } from "lucide-react";

export default function PrintTriggerButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
      >
        <Printer size={20} /> Print Invoice
      </button>

      <button
        onClick={() => window.history.back()}
        className="bg-white hover:bg-gray-100 text-slate-700 px-4 py-3 rounded-full font-bold shadow flex items-center gap-2"
      >
        <ArrowLeft size={20} /> Back
      </button>
    </>
  );
}
