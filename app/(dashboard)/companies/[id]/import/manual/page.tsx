"use client";

import { useState, use } from "react";
import { importTallyXML } from "@/app/actions/upload-tally";
import {
  UploadCloud,
  FileCode,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ManualImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importTallyXML(formData, Number(id));
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "Import successful!");
      } else {
        setStatus("error");
        setMessage(res.error || "Import failed.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Critical error during upload.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/companies/${id}/import`}
          className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">
          Manual Sales Import
        </h1>
      </div>

      <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-colors">
        {status === "success" ? (
          <div className="text-emerald-600 flex flex-col items-center gap-2">
            <CheckCircle size={48} />
            <h3 className="font-bold text-lg">Import Complete</h3>
            <p className="text-sm text-slate-500">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-xs font-bold underline"
            >
              Import Another
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud size={32} />
            </div>

            <input
              type="file"
              accept=".xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />

            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all">
                {file ? "Change File" : "Select XML File"}
              </span>
            </label>

            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg">
                <FileCode size={16} /> {file.name}
              </div>
            )}

            {file && (
              <button
                onClick={handleUpload}
                disabled={status === "uploading"}
                className="mt-6 w-full max-w-xs bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
              >
                {status === "uploading" ? "Processing..." : "Start Import"}
              </button>
            )}

            {status === "error" && (
              <div className="mt-6 text-rose-600 bg-rose-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> {message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
