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

  const onDownload = async () => {
    setLoading(true);
    try {
      const result = await downloadBackup();
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/sql" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tally_backup_${
          new Date().toISOString().split("T")[0]
        }.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.location.reload(); // Refresh to show new log
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
      !confirm("Are you sure? This will overwrite your entire cloud database!")
    )
      return;

    setLoading(true);
    try {
      const result = await restoreDatabase(formData);
      if (result.success) {
        alert("Restore Successful! Page will reload.");
        window.location.reload();
      } else {
        alert("Restore Error: " + result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-xl font-bold mb-2">Export Data</h2>
          <p className="text-gray-500 text-sm mb-6">
            Download a complete .sql copy of your records.
          </p>
          <button
            onClick={onDownload}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? "Processing..." : "Download SQL File"}
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Restore System
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload a .sql file to restore your database.
          </p>
          <form action={handleRestoreAction}>
            <input
              type="file"
              name="file"
              accept=".sql"
              className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-700"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? "Uploading..." : "Start Restore"}
            </button>
          </form>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="font-bold text-gray-800">Activity Log</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initialLogs.map((log) => (
              <tr key={log.id} className="text-sm">
                <td className="px-6 py-4">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                  {log.actionType}
                </td>
                <td className="px-6 py-4">{log.performedBy}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
