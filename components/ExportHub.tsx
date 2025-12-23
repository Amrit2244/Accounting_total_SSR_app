"use client";

import { useState } from "react";
import { Database, FileCode, Loader2 } from "lucide-react";
import { getFullCompanyData } from "@/app/actions/export";

export default function ExportHub({ companyId }: { companyId: number }) {
  const [loading, setLoading] = useState(false);

  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const result = await getFullCompanyData(companyId);
      if (result.success && result.data) {
        downloadFile(
          JSON.stringify(result.data, null, 2),
          `Backup_${companyId}_${new Date().toISOString().split("T")[0]}.json`,
          "application/json"
        );
      } else {
        alert(result.error || "Backup failed");
      }
    } catch (err) {
      alert("An unexpected error occurred during backup.");
    } finally {
      setLoading(false);
    }
  };

  const handleTallyXML = async () => {
    setLoading(true);
    try {
      const result = await getFullCompanyData(companyId);
      if (result.success && result.data) {
        const d = result.data;
        let xml = `<?xml version="1.0"?>\n<ENVELOPE>\n<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>\n<BODY>\n<IMPORTDATA>\n<REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>\n<REQUESTDATA>\n`;

        // Map through ledgers to create Tally-compatible XML
        d.ledgers.forEach((l: any) => {
          const parentName = l.group?.name || "Suspense Account";
          xml += `<TALLYMESSAGE xmlns:UDF="TallyUDF">\n<LEDGER NAME="${l.name}" RESERVEDNAME="">\n<NAME>${l.name}</NAME>\n<PARENT>${parentName}</PARENT>\n<OPENINGBALANCE>${l.openingBalance}</OPENINGBALANCE>\n</LEDGER>\n</TALLYMESSAGE>\n`;
        });

        xml += `</REQUESTDATA>\n</IMPORTDATA>\n</BODY>\n</ENVELOPE>`;

        const fileName = d.company?.name
          ? `Tally_Sync_${d.company.name.replace(/\s+/g, "_")}.xml`
          : `Tally_Sync_${companyId}.xml`;

        downloadFile(xml, fileName, "text/xml");
      } else {
        alert(result.error || "XML generation failed");
      }
    } catch (err) {
      alert("An unexpected error occurred during XML generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Database size={20} />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              System Backup
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-4">
            Download complete JSON dump of Ledgers, Groups & Vouchers.
          </p>
        </div>
        <button
          onClick={handleBackup}
          disabled={loading}
          className="w-full h-9 bg-slate-900 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            "Download JSON"
          )}
        </button>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <FileCode size={20} />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Tally Prime Sync
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-4">
            Export masters in XML format compatible with Tally import.
          </p>
        </div>
        <button
          onClick={handleTallyXML}
          disabled={loading}
          className="w-full h-9 border border-slate-300 text-slate-600 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            "Generate XML"
          )}
        </button>
      </div>
    </div>
  );
}
