"use client";

import { useState } from "react";
import {
  Database,
  FileCode,
  Loader2,
  Download,
  CloudDownload,
} from "lucide-react";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* JSON Backup Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                System Backup
              </h2>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                JSON Format
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
            Download a complete JSON dump including all Ledgers, Groups,
            Vouchers, and Inventory Masters for offline storage.
          </p>
        </div>
        <button
          onClick={handleBackup}
          disabled={loading}
          className="w-full h-11 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Download size={16} />
              <span>Download Backup</span>
            </>
          )}
        </button>
      </div>

      {/* XML Export Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
              <FileCode size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Tally Prime Sync
              </h2>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                XML Format
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
            Generate an XML file compatible with Tally Prime's import feature to
            synchronize your Masters and Vouchers.
          </p>
        </div>
        <button
          onClick={handleTallyXML}
          disabled={loading}
          className="w-full h-11 bg-white border-2 border-slate-100 hover:border-orange-200 text-slate-600 hover:text-orange-700 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <CloudDownload size={16} />
              <span>Generate XML</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
