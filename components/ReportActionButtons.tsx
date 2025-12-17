"use client";

import {
  Printer,
  FileDown,
  FileSpreadsheet,
  FileCode,
  FileType,
  FileJson,
  Download,
} from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";

interface Props {
  ledgerName?: string;
  entries?: any[];
  openingBalance?: number;
}

export default function ReportActionButtons({
  ledgerName = "Statement",
  entries = [],
  openingBalance = 0,
}: Props) {
  const searchParams = useSearchParams();
  const params = useParams();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const companyId = params.id;

  // Prepare data for non-PDF exports
  const prepareExportData = () => {
    let runningBal = openingBalance;
    return entries.map((e: any) => {
      runningBal += e.amount;
      const oppositeEntries = e.voucher.entries.filter(
        (vch: any) => vch.ledgerId !== e.ledgerId
      );
      const partyNames = Array.from(
        new Set(oppositeEntries.map((oe: any) => oe.ledger.name))
      ).join(", ");

      return {
        Date: new Date(e.voucher.date).toLocaleDateString("en-IN"),
        TXID: e.voucher.transactionCode,
        Vch_Type: e.voucher.type,
        Vch_No: e.voucher.voucherNo,
        Particulars: e.voucher.narration || "Entry Post",
        Party_Account: partyNames || "Self",
        Debit: e.amount > 0 ? e.amount : 0,
        Credit: e.amount < 0 ? Math.abs(e.amount) : 0,
        Balance:
          Math.abs(runningBal).toFixed(2) + (runningBal >= 0 ? " Dr" : " Cr"),
      };
    });
  };

  const handlePrint = () => {
    const ledgerId = searchParams.get("ledgerId");
    if (!ledgerId) {
      alert("Please select a ledger account first.");
      return;
    }
    const currentParams = searchParams.toString();
    const printUrl = `/print/ledger/${companyId}?${currentParams}`;
    window.open(printUrl, "_blank");
  };

  const downloadFile = (content: string, type: string, extension: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ledger_${ledgerName}_${new Date().toLocaleDateString()}.${extension}`;
    link.click();
  };

  const exportActions = {
    excel: () => {
      const data = prepareExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
      XLSX.writeFile(workbook, `Ledger_${ledgerName}.xlsx`);
    },
    csv: () => {
      const data = prepareExportData();
      const headers = Object.keys(data[0]).join(",");
      const rows = data
        .map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        )
        .join("\n");
      downloadFile(`${headers}\n${rows}`, "text/csv", "csv");
    },
    json: () => {
      const data = prepareExportData();
      downloadFile(JSON.stringify(data, null, 2), "application/json", "json");
    },
    xml: () => {
      const data = prepareExportData();
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<LedgerStatement ledger="${ledgerName}">\n`;
      data.forEach((row) => {
        xml += `  <Entry>\n`;
        Object.entries(row).forEach(([key, val]) => {
          xml += `    <${key}>${val}</${key}>\n`;
        });
        xml += `  </Entry>\n`;
      });
      xml += `</LedgerStatement>`;
      downloadFile(xml, "application/xml", "xml");
    },
  };

  return (
    <div className="flex gap-3 no-print relative">
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <FileDown size={16} /> EXPORT
        </button>

        {isExportOpen && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 grid gap-1">
              <button
                onClick={() => {
                  exportActions.excel();
                  setIsExportOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" /> Excel
                Spreadsheet (.xlsx)
              </button>
              <button
                onClick={() => {
                  exportActions.csv();
                  setIsExportOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
              >
                <FileType size={16} className="text-blue-600" /> CSV (Comma
                Separated)
              </button>
              <button
                onClick={() => {
                  exportActions.xml();
                  setIsExportOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-colors"
              >
                <FileCode size={16} className="text-orange-600" /> XML Document
              </button>
              <button
                onClick={() => {
                  exportActions.json();
                  setIsExportOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileJson size={16} /> JSON Data
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handlePrint}
        className="bg-slate-900 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-blue-100"
      >
        <Printer size={16} /> PRINT STATEMENT
      </button>
    </div>
  );
}
