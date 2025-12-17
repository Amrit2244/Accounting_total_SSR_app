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
  };

  const handleBackup = async () => {
    setLoading(true);
    const result = await getFullCompanyData(companyId);
    if (result.success) {
      const fileName = `Backup_Company_${companyId}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      downloadFile(
        JSON.stringify(result.data, null, 2),
        fileName,
        "application/json"
      );
    }
    setLoading(false);
  };

  const handleTallyXML = async () => {
    setLoading(true);
    const result = await getFullCompanyData(companyId);
    if (result.success && result.data) {
      const d = result.data;
      // Basic Tally XML Structure for Masters
      let xml = `<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

      // Map Ledgers to Tally Format
      d.ledgers.forEach((l: any) => {
        xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n          <LEDGER NAME="${
          l.name
        }" RESERVEDNAME="">\n            <NAME>${
          l.name
        }</NAME>\n            <PARENT>${
          l.groupId || "Suspense Account"
        }</PARENT>\n            <OPENINGBALANCE>${
          l.openingBalance
        }</OPENINGBALANCE>\n          </LEDGER>\n        </TALLYMESSAGE>\n`;
      });

      xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;

      const fileName = `Tally_Import_${d.name.replace(/\s+/g, "_")}.xml`;
      downloadFile(xml, fileName, "text/xml");
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Backup Option */}
      <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
        <Database
          className="text-slate-400 group-hover:text-blue-600 mb-4 transition-colors"
          size={40}
        />
        <h2 className="text-xl font-bold text-slate-900">Full System Backup</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Generates a JSON file containing all Ledgers, Groups, and Vouchers.
        </p>
        <button
          onClick={handleBackup}
          disabled={loading}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Download JSON Backup"
          )}
        </button>
      </div>

      {/* Tally XML Option */}
      <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
          <FileCode className="text-orange-600" size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Tally Prime Sync</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Export masters and daybook entries in Tally-compatible XML format.
        </p>
        <button
          onClick={handleTallyXML}
          disabled={loading}
          className="w-full py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Generate Tally XML"
          )}
        </button>
      </div>
    </div>
  );
}
