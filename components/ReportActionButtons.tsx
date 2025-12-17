"use client";

import { Printer, FileDown } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";

export default function ReportActionButtons() {
  const searchParams = useSearchParams();
  const params = useParams();

  // Get companyId from the dynamic route segment [id]
  const companyId = params.id;

  const handlePrint = () => {
    const ledgerId = searchParams.get("ledgerId");

    if (!ledgerId) {
      alert("Please select a ledger account first.");
      return;
    }

    // Capture current filter state (ledgerId, from, to)
    const currentParams = searchParams.toString();

    // Open the dedicated print page in a new window/tab
    // This route is at app/print/ledger/[id]/page.tsx
    const printUrl = `/print/ledger/${companyId}?${currentParams}`;

    window.open(printUrl, "_blank");
  };

  return (
    <div className="flex gap-3 no-print">
      <button
        type="button"
        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-sm"
      >
        <FileDown size={16} /> EXPORT
      </button>

      <button
        onClick={handlePrint}
        className="bg-slate-900 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-blue-100"
      >
        <Printer size={16} /> PRINT STATEMENT
      </button>
    </div>
  );
}
