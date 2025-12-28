"use client";

import React, { useState, use, useRef } from "react";
import {
  syncLocalTally,
  getVoucherList,
  syncSingleVoucher,
} from "@/app/actions/tally";
import {
  Loader2,
  Database,
  ArrowLeft,
  Square,
  DownloadCloud,
  Settings,
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
  const [status, setStatus] = useState("Ready to Sync");
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

  const handleDeepSync = async (vType: string) => {
    setIsSyncing(true);
    setProgress(0);
    stopSignal.current = false;
    setLog([`Initializing ${vType} connection...`]);
    setStatus(`Fetching ${vType} List...`);

    try {
      // Fetching list from Tally
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
          setLog((prev) => ["⚠️ Sync cancelled by user.", ...prev]);
          setStatus(`Stopped at ${completed} / ${vList.length}`);
          break;
        }

        const batch = vList.slice(i, i + batchSize);

        // Process batch using the universal sync function
        await Promise.all(
          batch.map((vNum) => syncSingleVoucher(Number(id), vNum))
        );

        completed += batch.length;
        setProgress(Math.round((completed / vList.length) * 100));
        setStatus(`Syncing ${vType}: ${completed} / ${vList.length}`);

        if (completed % 20 === 0) {
          setLog((prev) => [
            `✅ Processed ${completed} ${vType} records...`,
            ...prev.slice(0, 5),
          ]);
        }
      }

      if (!stopSignal.current) {
        setStatus(`Successfully Imported ${vList.length} ${vType} Vouchers!`);
        setLog((prev) => [`🎊 Finished ${vType} Import.`, ...prev]);
      }
    } catch (err) {
      setStatus("Sync failed. Check terminal for logs.");
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
            <Database size={20} className="text-indigo-600" /> Tally Data
            Migration
          </h2>
          <div className="w-5" />
        </div>

        <div className="p-8 space-y-6">
          {/* Progress Bar Area */}
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

          {/* Real-time Logs */}
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
                {/* Step 1: Masters */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => syncLocalTally(Number(id), 1)}
                    className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <Settings size={14} /> 1. Sync Ledger Masters
                  </button>
                </div>

                {/* Step 2: Voucher Selection */}
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                    2. Select Voucher Type to Import
                  </p>
                  {/* Updated Grid for 6 Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ImportButton
                      label="Sales"
                      onClick={() => handleDeepSync("Sales")}
                      color="bg-emerald-600"
                    />
                    <ImportButton
                      label="Purchase"
                      onClick={() => handleDeepSync("Purchase")}
                      color="bg-blue-600"
                    />
                    <ImportButton
                      label="Payment"
                      onClick={() => handleDeepSync("Payment")}
                      color="bg-rose-600"
                    />
                    <ImportButton
                      label="Receipt"
                      onClick={() => handleDeepSync("Receipt")}
                      color="bg-indigo-600"
                    />
                    <ImportButton
                      label="Contra"
                      onClick={() => handleDeepSync("Contra")}
                      color="bg-slate-700"
                    />
                    <ImportButton
                      label="Journal"
                      onClick={() => handleDeepSync("Journal")}
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
