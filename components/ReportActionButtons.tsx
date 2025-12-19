"use client";

import {
  Printer,
  FileDown,
  FileSpreadsheet,
  FileCode,
  FileType,
  FileJson,
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
      alert("Select a ledger first.");
      return;
    }
    window.open(
      `/companies/${companyId}/reports/ledger/print?${searchParams.toString()}`,
      "_blank"
    );
  };

  const downloadFile = (content: string, type: string, ext: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = `Ledger_${ledgerName}_${
      new Date().toISOString().split("T")[0]
    }.${ext}`;
    a.click();
  };

  const exports = {
    excel: () => {
      const ws = XLSX.utils.json_to_sheet(prepareExportData());
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `Ledger_${ledgerName}.xlsx`);
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
    json: () =>
      downloadFile(
        JSON.stringify(prepareExportData(), null, 2),
        "application/json",
        "json"
      ),
    xml: () => {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<LedgerStatement ledger="${ledgerName}">\n`;
      prepareExportData().forEach((row) => {
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
    <div className="flex gap-2 no-print relative">
      <div className="relative">
        <button
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <FileDown size={14} /> EXPORT
        </button>
        {isExportOpen && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
            <button
              onClick={() => {
                exports.excel();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg uppercase"
            >
              <FileSpreadsheet size={14} /> Excel (.xlsx)
            </button>
            <button
              onClick={() => {
                exports.csv();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg uppercase"
            >
              <FileType size={14} /> CSV
            </button>
            <button
              onClick={() => {
                exports.xml();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg uppercase"
            >
              <FileCode size={14} /> XML
            </button>
            <button
              onClick={() => {
                exports.json();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg uppercase"
            >
              <FileJson size={14} /> JSON
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handlePrint}
        className="bg-slate-900 hover:bg-black text-white px-4 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-md"
      >
        <Printer size={14} /> PRINT
      </button>
    </div>
  );
}
