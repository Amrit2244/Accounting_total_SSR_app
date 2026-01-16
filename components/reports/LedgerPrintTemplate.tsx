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

  // Accounting formatting helpers
  const fmt = (n: number) =>
    Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // Logic: Negative is Dr, Positive is Cr (Tally standard)
  const getSide = (n: number) => (n <= 0 ? "Dr" : "Cr");

  let runningBalance = openingBalance;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-12 print:p-0 print:bg-white font-sans text-slate-900 print:overflow-visible print:h-auto">
      {/* FLOATING ACTION TOOLBAR - HIDDEN IN PRINT */}
      <div className="fixed top-24 right-10 flex flex-col gap-5 print:hidden z-[999999]">
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

        <button
          onClick={() => router.back()}
          className="bg-slate-800 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-black transition-all hover:scale-110 active:scale-95"
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* THE STATEMENT PAGE */}
      <div className="max-w-[210mm] mx-auto bg-white border border-slate-200 shadow-2xl print:shadow-none print:border-none p-10 print:p-0 min-h-[297mm] print:min-h-0 print:h-auto flex flex-col print:block overflow-visible relative">
        {/* HEADER SECTION */}
        {showCompanyDetails ? (
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-lg print:border print:border-slate-900 print:text-slate-900 print:bg-white">
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
              <div className="text-4xl font-black text-slate-100 print:text-slate-400 uppercase tracking-tighter mb-4">
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
          <div className="h-40 print:h-40 border-b border-dashed border-slate-200 mb-8 flex items-end justify-between pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              Account Statement
            </span>
          </div>
        )}

        {/* ACCOUNT INFO CARD */}
        <div className="mb-10 p-6 rounded-2xl bg-slate-900 text-white print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 flex justify-between items-center shadow-lg print:shadow-none relative">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 print:text-slate-500 mb-1">
              Statement Of Account
            </p>
            <h3 className="text-2xl font-black tracking-tight">
              {ledger.name}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/10 print:bg-slate-200 px-2 py-0.5 rounded mt-2 inline-block">
              Group: {ledger.group?.name}
            </span>
          </div>
          <div className="text-right border-l border-white/10 print:border-slate-300 pl-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 print:text-slate-500 mb-1">
              Generated On
            </p>
            <p className="text-xs font-bold font-mono">
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
            <thead className="print:table-header-group">
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
                  Debit (Dr)
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Credit (Cr)
                </th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-slate-100">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50 font-bold border-b border-slate-200">
                <td
                  className="py-4 px-2 text-indigo-600 italic text-[9px]"
                  colSpan={3}
                >
                  Opening Balance (Brought Forward)
                </td>
                <td className="py-4 px-2 text-right font-mono text-rose-600">
                  {openingBalance <= 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="py-4 px-2 text-right font-mono text-emerald-600">
                  {openingBalance > 0 ? fmt(openingBalance) : ""}
                </td>
                <td className="py-4 px-2 text-right font-mono font-black text-slate-900">
                  {fmt(openingBalance)} {getSide(openingBalance)}
                </td>
              </tr>

              {/* Transactions */}
              {transactions.map((t: any) => {
                runningBalance += t.amount;
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 transition-colors break-inside-avoid print:break-inside-avoid"
                    style={{ breakInside: "avoid" }} // Ensure row doesn't split across pages
                  >
                    <td className="py-3 px-2 whitespace-nowrap font-medium text-slate-500">
                      {new Date(t.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-2 font-mono text-[9px] text-slate-400 uppercase leading-tight">
                      {t.type} <br />
                      <span className="text-slate-300 font-bold">
                        #{t.voucherNo}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-800 uppercase tracking-tight">
                        {t.particulars}
                      </div>
                      {t.narration && (
                        <div className="text-[9px] text-slate-400 italic mt-0.5 leading-tight">
                          {t.narration}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-rose-600">
                      {t.amount <= 0 ? fmt(t.amount) : ""}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">
                      {t.amount > 0 ? fmt(t.amount) : ""}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-black text-slate-900 bg-slate-50/30">
                      {fmt(runningBalance)} {getSide(runningBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="mt-12 pt-10 border-t-2 border-slate-100 flex justify-between items-end break-inside-avoid">
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
                <span
                  className={`text-xl ${
                    runningBalance <= 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
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
