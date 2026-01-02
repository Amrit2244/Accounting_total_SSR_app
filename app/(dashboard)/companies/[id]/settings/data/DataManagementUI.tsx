"use client";

import { useState } from "react";
import {
  downloadBackup,
  restoreDatabase,
} from "../../../../../actions/database";

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

  // Handle Download Logic
  const onDownload = async () => {
    setLoading(true);
    const result = await downloadBackup();
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/sql" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tally_backup_${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Failed to generate backup.");
    }
    setLoading(false);
  };

  // Handle Restore Logic (Form Action Wrapper)
  async function handleRestoreAction(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      alert("Please select a valid .sql file");
      return;
    }

    if (
      !confirm(
        "CRITICAL WARNING: This will delete all current data and restore from the file. Proceed?"
      )
    )
      return;

    setLoading(true);
    const result = await restoreDatabase(formData);
    setLoading(false);

    if (result.success) {
      alert("Database Restored Successfully! The page will now refresh.");
      window.location.reload();
    } else {
      alert(result.error || "Restore failed");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold mb-2">Export Data</h2>
          <p className="text-gray-500 text-sm mb-6">
            Create a secure backup of all ledgers, companies, and vouchers.
          </p>
          <button
            onClick={onDownload}
            disabled={loading}
            className="w-full py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 disabled:bg-slate-300"
          >
            {loading ? "Preparing File..." : "Download .SQL Backup"}
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-red-100">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Import/Restore
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Restore your system using a previously downloaded SQL file.
          </p>
          <form action={handleRestoreAction}>
            <input
              type="file"
              name="file"
              accept=".sql"
              className="block w-full text-xs text-gray-400 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300"
            >
              {loading ? "Restoring Data..." : "Upload & Restore"}
            </button>
          </form>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-700">Recent Data Operations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase bg-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Performed By</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialLogs.map((log) => (
                <tr key={log.id} className="text-sm hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold">{log.actionType}</td>
                  <td className="px-6 py-4">{log.performedBy}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {initialLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No activity recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
