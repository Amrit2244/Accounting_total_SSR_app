"use client";

import React, { useState, use, useRef } from "react";
import {
  syncLocalTally,
  getVoucherList,
  syncSingleVoucher,
} from "@/app/actions/tally";
import {
  Database,
  ArrowLeft,
  Square,
  DownloadCloud,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [progress, setProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState("Ready to Import");
  const [log, setLog] = useState<string[]>([]);

  const stopSignal = useRef(false);

  const handleStop = () => {
    stopSignal.current = true;
    setStatus("Stopping import...");
    setLog((prev) => [
      "🛑 Stop signal sent. Finishing current batch...",
      ...prev,
    ]);
  };

  // --- 1. MASTER IMPORT HANDLER (The option you asked for) ---
  const handleMasterImport = async () => {
    setIsSyncing(true); // Locks the screen
    setProgress(0);
    setStatus("Importing Masters...");
    setLog(["🚀 Connecting to Tally to Import Groups & Ledgers..."]);

    try {
      // Calls the backend action to fetch XML and save to DB
      const res = await syncLocalTally(Number(id), 1);

      if (res.success) {
        setLog((prev) => [
          "✅ Master Import Successful! (Groups & Ledgers Saved)",
          ...prev,
        ]);
        setStatus("Master Import Complete");
        setProgress(100);
      } else {
        setLog((prev) => [`❌ Error: ${res.error}`, ...prev]);
        setStatus("Master Import Failed");
      }
    } catch (err) {
      setLog((prev) => ["❌ Critical Error during Master Import", ...prev]);
    } finally {
      setIsSyncing(false); // Unlocks the screen
    }
  };

  // --- 2. VOUCHER IMPORT HANDLER ---
  const handleVoucherImport = async (vType: string) => {
    setIsSyncing(true);
    setProgress(0);
    stopSignal.current = false;
    setLog([`Initializing ${vType} Import...`]);
    setStatus(`Fetching ${vType} List...`);

    try {
      const vList = await getVoucherList(
        Number(id),
        "20240401", // Financial Year Start
        "20250331", // Financial Year End
        vType
      );

      if (vList.length === 0) {
        setStatus(`No ${vType} Vouchers found.`);
        setIsSyncing(false);
        return;
      }

      setLog((prev) => [
        `Found ${vList.length} ${vType} vouchers. Starting import...`,
        ...prev,
      ]);

      const batchSize = 10;
      let completed = 0;

      for (let i = 0; i < vList.length; i += batchSize) {
        if (stopSignal.current) {
          setLog((prev) => ["⚠️ Import cancelled by user.", ...prev]);
          setStatus(`Stopped at ${completed} / ${vList.length}`);
          break;
        }

        const batch = vList.slice(i, i + batchSize);

        await Promise.all(
          batch.map((vNum) => syncSingleVoucher(Number(id), vNum))
        );

        completed += batch.length;
        setProgress(Math.round((completed / vList.length) * 100));
        setStatus(`Importing ${vType}: ${completed} / ${vList.length}`);

        if (completed % 20 === 0) {
          setLog((prev) => [
            `✅ Imported ${completed} ${vType} records...`,
            ...prev.slice(0, 5),
          ]);
        }
      }

      if (!stopSignal.current) {
        setStatus(`Successfully Imported ${vList.length} ${vType} Vouchers!`);
        setLog((prev) => [`🎊 Finished ${vType} Import.`, ...prev]);
      }
    } catch (err) {
      setStatus("Import failed. Check logs.");
      setLog((prev) => [
        `❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        ...prev,
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10">
      <div className="bg-white border rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <Link
            href={`/companies/${id}`}
            className="text-slate-400 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="font-bold flex items-center gap-2 text-slate-700">
            <Database size={20} className="text-indigo-600" /> Tally Data Import
          </h2>
          <div className="w-5" />
        </div>

        <div className="p-8 space-y-6">
          {/* Progress Bar & Status */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full border overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stopSignal.current ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Logs Window */}
          <div className="bg-slate-900 rounded-2xl p-4 h-40 overflow-hidden font-mono text-[10px] text-emerald-400 shadow-inner">
            {log.map((line, i) => (
              <div
                key={i}
                className="mb-1 leading-relaxed border-l border-emerald-900 pl-2 text-wrap"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {!isSyncing ? (
              <>
                {/* --- SECTION 1: MASTER IMPORT --- */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleMasterImport}
                    className="py-4 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs uppercase hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 border border-indigo-200 shadow-sm"
                  >
                    <Settings size={16} /> 1. Import Tally Masters (Groups &
                    Ledgers)
                  </button>
                </div>

                {/* --- SECTION 2: VOUCHER IMPORT --- */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center mt-3">
                    2. Select Voucher Type to Import
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ImportButton
                      label="Sales"
                      onClick={() => handleVoucherImport("Sales")}
                      color="bg-emerald-600"
                    />
                    <ImportButton
                      label="Purchase"
                      onClick={() => handleVoucherImport("Purchase")}
                      color="bg-blue-600"
                    />
                    <ImportButton
                      label="Payment"
                      onClick={() => handleVoucherImport("Payment")}
                      color="bg-rose-600"
                    />
                    <ImportButton
                      label="Receipt"
                      onClick={() => handleVoucherImport("Receipt")}
                      color="bg-indigo-600"
                    />
                    <ImportButton
                      label="Contra"
                      onClick={() => handleVoucherImport("Contra")}
                      color="bg-slate-700"
                    />
                    <ImportButton
                      label="Journal"
                      onClick={() => handleVoucherImport("Journal")}
                      color="bg-amber-600"
                    />
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-black text-xs uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Square size={14} fill="currentColor" /> Stop Import Process
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 ${color} text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100/20 active:scale-95`}
    >
      <DownloadCloud size={14} /> {label}
    </button>
  );
}
