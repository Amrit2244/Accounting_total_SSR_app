"use client";

import { useState } from "react";
import {
  downloadBackup,
  restoreDatabase,
} from "../../../../../actions/database";
import {
  Download,
  UploadCloud,
  Database,
  History,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface Log {
  id: string;
  actionType: string;
  performedBy: string;
  status: string;
  timestamp: Date;
}

export default function DataManagementUI({
  initialLogs,
}: {
  initialLogs: Log[];
}) {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    setLoading(true);
    try {
      const result = await downloadBackup();
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/sql" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `accounting_backup_${
          new Date().toISOString().split("T")[0]
        }.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.location.reload();
      } else {
        alert("Backup Error: " + result.error);
      }
    } catch (err) {
      alert("System error during backup.");
    } finally {
      setLoading(false);
    }
  };

  async function handleRestoreAction(formData: FormData) {
    if (
      !confirm(
        "CRITICAL WARNING: This will permanently overwrite your entire cloud database. Are you absolutely sure?"
      )
    )
      return;

    setLoading(true);
    try {
      const result = await restoreDatabase(formData);
      if (result.success) {
        alert("Restore Successful! System will now reload.");
        window.location.reload();
      } else {
        alert("Restore Error: " + result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Download size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Database size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">
              Export Data
            </h2>
          </div>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Generate a complete SQL dump of your ledgers, inventory, and
            transaction history for offline storage.
          </p>
          <button
            onClick={onDownload}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Download size={20} />
            )}
            <span>Download SQL Backup</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-600">
            <AlertOctagon size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-rose-600">
            <UploadCloud size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">
              System Restore
            </h2>
          </div>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Upload a valid SQL backup to restore the system state.{" "}
            <span className="font-bold text-rose-600">
              Warning: All current data will be lost.
            </span>
          </p>
          <form action={handleRestoreAction} className="space-y-4">
            <input
              type="file"
              name="file"
              accept=".sql"
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 transition-all"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <AlertOctagon size={20} />
              )}
              <span>Initiate Full Restore</span>
            </button>
          </form>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 backdrop-blur-sm px-8 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={20} className="text-slate-400" />
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
              Maintenance Audit Log
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Last 15 Operations
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Operation</th>
                <th className="px-8 py-4">Administrator</th>
                <th className="px-8 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogs.map((log) => (
                <tr
                  key={log.id}
                  className="text-sm hover:bg-slate-50 transition-colors"
                >
                  <td className="px-8 py-4 text-xs font-medium text-slate-600">
                    {new Date(log.timestamp).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-8 py-4 font-mono font-black text-indigo-600 text-xs">
                    {log.actionType}
                  </td>
                  <td className="px-8 py-4 text-slate-700 font-bold">
                    {log.performedBy}
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {log.status === "SUCCESS" ? (
                        <CheckCircle2 size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
