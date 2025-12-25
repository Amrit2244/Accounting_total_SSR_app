"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

// --- CUSTOM HELPER INSTEAD OF LIBRARY ---
const amountToWords = (num: number): string => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const n = Math.floor(Math.abs(num)).toString();
  if (n.length > 9) return "Overflow";

  let tn = ("000000000" + n).substr(-9);
  let str = "";
  str += tn[0] != "0" ? (a[Number(tn[0])] || "") + "Hundred " : "";
  str +=
    tn[1] != "0"
      ? (a[Number(tn[1])] || b[Number(tn[1])] + " " + a[Number(tn[2])]) +
        "Crore "
      : tn[2] != "0"
      ? a[Number(tn[2])] + "Crore "
      : "";
  str +=
    tn[3] != "0"
      ? (a[Number(tn[3])] || b[Number(tn[3])] + " " + a[Number(tn[4])]) +
        "Lakh "
      : tn[4] != "0"
      ? a[Number(tn[4])] + "Lakh "
      : "";
  str +=
    tn[5] != "0"
      ? (a[Number(tn[5])] || b[Number(tn[5])] + " " + a[Number(tn[6])]) +
        "Thousand "
      : tn[6] != "0"
      ? a[Number(tn[6])] + "Thousand "
      : "";
  str +=
    tn[7] != "0"
      ? (a[Number(tn[7])] || b[Number(tn[7])] + " " + a[Number(tn[8])]) +
        "Hundred "
      : "";
  str +=
    tn[8] != "0"
      ? (str != "" ? "and " : "") +
        (a[Number(tn[8])] || b[Number(tn[8])] + " " + a[Number(tn[9])])
      : a[Number(tn[9])] || b[Number(tn[8])] + " " + a[Number(tn[9])];

  return str.trim() + " ONLY";
};

export default function VoucherPrintTemplate({
  voucher,
  type,
}: {
  voucher: any;
  type: string;
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(true);

  if (!voucher) return null;

  const fmt = (n: number) =>
    (Math.abs(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // Find Payee and Source
  const payeeEntry = voucher.ledgerEntries?.find((e: any) => e.amount < 0);
  const paymentSource = voucher.ledgerEntries?.find((e: any) => e.amount > 0);

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white font-sans text-slate-900">
      {/* NUCLEAR PRINT CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden !important; }
          #vch-print-zone, #vch-print-zone * { visibility: visible !important; }
          #vch-print-zone { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, aside, footer, .no-print { display: none !important; }
        }
      `,
        }}
      />

      {/* FLOATING CONTROLS */}
      <div className="fixed top-24 right-10 flex flex-col gap-4 no-print z-[99999]">
        <button
          onClick={() => window.print()}
          className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all shadow-indigo-200"
        >
          <Printer size={24} />
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-white border w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        >
          {showDetails ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-white border text-slate-400 w-14 h-14 rounded-full shadow-md flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* PAYMENT VOUCHER SHEET */}
      <div
        id="vch-print-zone"
        className="max-w-[210mm] mx-auto bg-white p-12 print:p-10 min-h-[297mm] flex flex-col border border-slate-200 print:border-none"
      >
        {/* HEADER SECTION */}
        {showDetails && (
          <div className="flex items-start gap-6 border-b-2 border-slate-900 pb-6 mb-4">
            <div className="w-20 h-20 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-4xl">
              {voucher.company?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter">
                {voucher.company?.name}
              </h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1 tracking-wider">
                GSTIN: {voucher.company?.gstin || "N/A"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-md mt-1">
                {voucher.company?.address}
              </p>
            </div>
          </div>
        )}

        <div className="text-center my-6">
          <h2 className="text-3xl font-black border-b-4 border-slate-900 inline-block px-12 pb-1 uppercase tracking-[0.2em]">
            {type} VOUCHER
          </h2>
        </div>

        {/* PAY TO SECTION */}
        <div className="space-y-6 mb-10 text-xs font-bold uppercase">
          <div className="flex items-end gap-4">
            <span className="text-slate-400 w-28 shrink-0">PAY TO</span>
            <div className="flex-1 border-b-2 border-slate-200 pb-1 text-base font-black text-slate-800">
              {payeeEntry?.ledger?.name || "—"}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400">Voucher No.</p>
              <p className="font-mono text-sm">#{voucher.voucherNo}</p>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <span className="text-slate-400 w-28 shrink-0">SUM OF</span>
            <div className="flex-1 border-b-2 border-slate-200 pb-1 text-indigo-700 font-black italic tracking-tight">
              {amountToWords(voucher.totalAmount)}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400">Date</p>
              <p className="font-mono text-sm">
                {new Date(voucher.date).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* PAYMENT DETAILS TABLE */}
        <div className="mb-8">
          <table className="w-full border-2 border-slate-900 text-[10px] font-black uppercase tracking-wider">
            <thead className="bg-slate-100 border-b-2 border-slate-900">
              <tr>
                <th className="border-r-2 border-slate-900 p-3 text-left">
                  Paid From (Source)
                </th>
                <th className="border-r-2 border-slate-900 p-3 text-left">
                  Mode of Payment
                </th>
                <th className="p-3 text-right">Amount Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm">
                <td className="border-r-2 border-slate-900 p-4">
                  {paymentSource?.ledger?.name || "Cash/Bank Account"}
                </td>
                <td className="border-r-2 border-slate-900 p-4">
                  E-Transfer / Cash
                </td>
                <td className="p-4 text-right font-black text-lg">
                  {fmt(voucher.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BREAKDOWN TABLE */}
        <div className="flex-1">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 uppercase font-black text-slate-400 tracking-widest">
                <th className="py-3 px-2 w-32">Account Ref</th>
                <th className="py-3 px-2">Description of Transaction</th>
                <th className="py-3 px-2 text-right w-40">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {voucher.ledgerEntries?.map((entry: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 group">
                  <td className="py-4 px-2 font-mono text-slate-500">
                    ACC-{entry.ledger?.id || "000"}
                  </td>
                  <td className="py-4 px-2">
                    <p className="font-black text-slate-800 uppercase">
                      {entry.ledger?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">
                      {voucher.narration || "Being transaction recorded"}
                    </p>
                  </td>
                  <td className="py-4 px-2 text-right font-black text-sm">
                    {fmt(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="mt-20 border-t-4 border-slate-900 pt-8">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
                Transaction Metadata
              </p>
              <div className="text-[9px] font-bold text-slate-500 space-y-1">
                <p>
                  MAKER ID:{" "}
                  <span className="text-slate-900">
                    {voucher.createdBy?.name || "ADMIN"}
                  </span>
                </p>
                <p>
                  TX CODE:{" "}
                  <span className="text-slate-900">
                    {voucher.transactionCode}
                  </span>
                </p>
                <p>
                  VERIFIED: <span className="text-emerald-600">YES</span>
                </p>
              </div>
            </div>

            <div className="flex gap-16">
              <div className="text-center w-40">
                <div className="h-16 flex items-end justify-center">
                  <div className="w-full border-b border-slate-300" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-900">
                  Approved By
                </p>
              </div>
              <div className="text-center w-40">
                <div className="h-16 flex items-end justify-center">
                  <div className="w-full border-b border-slate-300" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-900">
                  Received By
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-slate-50 pt-4">
          <p className="text-[8px] font-black text-slate-300 tracking-[0.5em] uppercase">
            Generated via FinCore Enterprise ERP
          </p>
        </div>
      </div>
    </div>
  );
}
