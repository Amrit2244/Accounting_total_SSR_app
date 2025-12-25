"use client";

import {
  Printer,
  FileDown,
  FileSpreadsheet,
  FileCode,
  FileType,
  FileJson,
  ChevronDown,
} from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const companyId = params.id;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="flex gap-3 no-print relative print:hidden">
      {/* Export Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsExportOpen(!isExportOpen)}
          className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm hover:border-indigo-300 hover:text-indigo-600 ${
            isExportOpen ? "ring-2 ring-indigo-100 border-indigo-300" : ""
          }`}
        >
          <FileDown size={14} />
          <span>Export</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${
              isExportOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExportOpen && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 min-w-[180px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1.5 ring-1 ring-slate-900/5 origin-top-right">
            <div className="px-3 py-2 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 mb-1">
              Select Format
            </div>
            <button
              onClick={() => {
                exports.excel();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 group-hover:bg-emerald-100 rounded-lg text-slate-500 group-hover:text-emerald-600 transition-colors">
                <FileSpreadsheet size={14} />
              </div>
              Excel (.xlsx)
            </button>
            <button
              onClick={() => {
                exports.csv();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 group-hover:bg-blue-100 rounded-lg text-slate-500 group-hover:text-blue-600 transition-colors">
                <FileType size={14} />
              </div>
              CSV
            </button>
            <button
              onClick={() => {
                exports.xml();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 group-hover:bg-orange-100 rounded-lg text-slate-500 group-hover:text-orange-600 transition-colors">
                <FileCode size={14} />
              </div>
              XML
            </button>
            <button
              onClick={() => {
                exports.json();
                setIsExportOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 group-hover:bg-white group-hover:shadow-sm rounded-lg text-slate-500 group-hover:text-slate-900 transition-all">
                <FileJson size={14} />
              </div>
              JSON
            </button>
          </div>
        )}
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="bg-slate-900 hover:bg-indigo-600 text-white px-5 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/20"
      >
        <Printer size={14} />
        <span>Print Report</span>
      </button>
    </div>
  );
}
