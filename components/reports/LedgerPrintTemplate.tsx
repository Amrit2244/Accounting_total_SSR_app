"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Building2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LedgerPrintTemplate({
  company,
  ledger,
  transactions,
  openingBalance,
  fromDate,
  toDate,
}: any) {
  const router = useRouter();
  const [showCompanyDetails, setShowCompanyDetails] = useState(true);

  const fmt = (n: number) =>
    Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const getSide = (n: number) => (n >= 0 ? "Dr" : "Cr");
  let runningBalance = openingBalance;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-12 print:p-0 print:bg-white font-sans text-slate-900 overflow-visible">
      {/* FLOATING ACTION TOOLBAR - MOVED DOWN AND INSET */}
      <div className="fixed top-24 right-10 flex flex-col gap-5 no-print z-[999999]">
        {/* PRINT BUTTON */}
        <button
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          title="Print Now"
        >
          <Printer
            size={26}
            className="group-hover:rotate-12 transition-transform"
          />
        </button>

        {/* TOGGLE COMPANY HEADER BUTTON */}
        <button
          onClick={() => setShowCompanyDetails(!showCompanyDetails)}
          className={`w-14 h-14 rounded-full shadow-xl flex flex-col items-center justify-center transition-all border hover:scale-110 active:scale-95 ${
            showCompanyDetails
              ? "bg-white text-slate-600 border-slate-200"
              : "bg-amber-500 text-white border-amber-600"
          }`}
          title={showCompanyDetails ? "Hide Company Info" : "Show Company Info"}
        >
          {showCompanyDetails ? <Eye size={20} /> : <EyeOff size={20} />}
          <span className="text-[8px] font-black uppercase mt-1 leading-none">
            Header
          </span>
        </button>

        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="bg-slate-800 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-black transition-all hover:scale-110 active:scale-95"
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* THE STATEMENT PAGE */}
      <div className="max-w-[210mm] mx-auto bg-white border border-slate-200 shadow-2xl print:shadow-none print:border-none p-10 print:p-8 min-h-[297mm] flex flex-col overflow-visible relative">
        {/* CONDITIONAL COMPANY HEADER */}
        {showCompanyDetails ? (
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Building2 size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {company.name}
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                    Financial Statement
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium max-w-sm leading-relaxed whitespace-pre-line">
                {company.address}
                <div className="mt-2 text-slate-900 font-bold">
                  GSTIN: {company.gstin || "N/A"}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-black text-slate-100 uppercase tracking-tighter mb-4">
                Statement
              </div>
              <div className="text-sm font-black text-slate-900">
                {new Date(fromDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                —{" "}
                {new Date(toDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        ) : (
          /* OFFSET FOR PRE-PRINTED LETTERHEAD */
          <div className="h-40 print:h-40 border-b border-dashed border-slate-200 mb-8 flex items-end justify-between pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              Account Statement
            </span>
          </div>
        )}

        {/* ACCOUNT INFO CARD */}
        <div className="mb-10 p-6 rounded-2xl bg-slate-900 text-white flex justify-between items-center shadow-lg relative">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">
              Statement Of Account
            </p>
            <h3 className="text-2xl font-black tracking-tight">
              {ledger.name}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded mt-2 inline-block">
              Group: {ledger.group?.name}
            </span>
          </div>
          <div className="text-right border-l border-white/10 pl-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">
              Generated On
            </p>
            <p className="text-xs font-bold font-mono" suppressHydrationWarning>
              {new Date().toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-50">
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ref / Type
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Particulars
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Debit
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Credit
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-slate-100">
              {/* Opening Balance */}
              <tr className="bg-slate-50 font-bold border-b border-slate-200">
                <td
                  className="py-4 px-2 text-indigo-600 italic text-[9px]"
                  colSpan={3}
                >
                  Opening Balance (Brought Forward)
                </td>
                <td className="py-4 px-2 text-right font-mono">
                  {openingBalance > 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="py-4 px-2 text-right font-mono">
                  {openingBalance < 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="py-4 px-2 text-right font-mono font-black text-slate-900">
                  {fmt(openingBalance)} {getSide(openingBalance)}
                </td>
              </tr>

              {/* Transactions */}
              {transactions.map((t: any) => {
                runningBalance += t.amount;
                return (
                  <tr key={t.id}>
                    <td className="py-3 px-2 whitespace-nowrap font-medium">
                      {new Date(t.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-2 font-mono text-[9px] text-slate-500 uppercase leading-tight">
                      {t.type} <br />{" "}
                      <span className="text-slate-400">#{t.voucherNo}</span>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-800 uppercase tracking-tighter">
                      {t.narration || "Entry Post"}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">
                      {t.amount > 0 ? fmt(t.amount) : ""}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">
                      {t.amount < 0 ? fmt(t.amount) : ""}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                      {fmt(runningBalance)} {getSide(runningBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-10 border-t-2 border-slate-100 flex justify-between items-end">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">
            <p>Report Generated By FinCore System</p>
            <p className="mt-1 font-mono">{new Date().getFullYear()}</p>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Final Balance
              </p>
              <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                ₹ {fmt(runningBalance)}{" "}
                <span className="text-xl text-indigo-600">
                  {getSide(runningBalance)}
                </span>
              </p>
            </div>
            <div className="text-center pt-4">
              <div className="w-48 border-t-2 border-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
