"use client";

import { Printer } from "lucide-react";

export default function LedgerPrintButton({ url }: { url: string }) {
  const handlePrint = () => {
    // Calculate center of screen
    const width = 900;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      url,
      "LedgerPrintWindow",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`,
    );
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all h-11 shadow-sm hover:shadow-md"
    >
      <Printer size={16} />
      <span>Print</span>
    </button>
  );
}
