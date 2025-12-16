import { getVoucherByCode } from "@/app/actions/voucher";
import VerifyActionBtn from "./verify-action-btn";
import Link from "next/link";
import {
  ShieldCheck,
  Ban,
  ArrowLeft,
  User,
  Printer,
  Clock,
  AlertTriangle,
  Package,
  FileText,
} from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string; code: string }>;
}) {
  const { id, code } = await params;
  const companyId = parseInt(id);

  const voucher = await getVoucherByCode(code, companyId);

  // Auth Check
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let currentUserId = 0;

  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey);
      currentUserId =
        parseInt(payload.userId as string) || parseInt(payload.sub as string);
    } catch (e) {}
  }

  // Error State
  if (!voucher) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center min-h-[50vh]">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-600">Invalid Transaction</h1>
        <p className="text-gray-600 mt-2">
          No voucher found with ID/Code: <strong>{code}</strong>
        </p>
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="mt-6 px-4 py-2 bg-gray-800 text-white rounded text-sm font-bold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isMaker = voucher.createdById === currentUserId;
  const isApproved = voucher.status === "APPROVED";

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white border-t-4 border-[#003366] shadow-xl rounded-sm mb-10">
      {/* HEADER */}
      <div className="bg-slate-50 p-6 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-[#003366]" />
            VERIFICATION TERMINAL
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-bold">
              ID: {voucher.transactionCode}
            </span>
            <span>
              Voucher:{" "}
              <strong>
                {voucher.type} #{voucher.voucherNo}
              </strong>
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isApproved ? (
            <div className="bg-green-600 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2">
              <ShieldCheck size={18} /> POSTED
            </div>
          ) : (
            <div className="bg-amber-500 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2">
              <Clock size={18} /> PENDING
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="p-8 space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <label className="block text-gray-500 font-bold text-[10px] uppercase">
              Created By
            </label>
            <div className="font-semibold text-slate-800 flex items-center gap-2 mt-1">
              <User size={14} className="text-blue-500" />{" "}
              {voucher.createdBy?.username || "Unknown"}
            </div>
          </div>
          <div>
            <label className="block text-gray-500 font-bold text-[10px] uppercase">
              Date
            </label>
            <div className="font-semibold text-slate-800 mt-1">
              {voucher.date.toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-gray-500 font-bold text-[10px] uppercase">
              Narration
            </label>
            <div className="font-semibold text-slate-800 italic mt-1">
              "{voucher.narration || "No narration provided"}"
            </div>
          </div>
        </div>

        {/* 1. INVENTORY TABLE (If Sales/Purchase) */}
        {voucher.inventory && voucher.inventory.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
              <Package size={16} className="text-gray-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase">
                Inventory Details
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold text-left">
                <tr>
                  <th className="p-3 pl-4">Item Name</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right pr-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voucher.inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 pl-4 font-bold text-slate-700">
                      {item.stockItem?.name || `Item ID: ${item.itemId}`}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {Math.abs(item.quantity)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-500">
                      {item.rate.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold pr-4">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Fallback message if no inventory found for a Sales voucher
          (voucher.type === "SALES" || voucher.type === "PURCHASE") && (
            <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-200 rounded">
              ⚠️ No Inventory Items found for this voucher.
            </div>
          )
        )}

        {/* 2. LEDGER ACCOUNTING TABLE */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
            <FileText size={16} className="text-gray-600" />
            <h3 className="text-xs font-bold text-gray-700 uppercase">
              Ledger Impact (Accounting)
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold text-left">
              <tr>
                <th className="p-3 pl-4">Particulars</th>
                <th className="p-3 text-right w-32">Debit</th>
                <th className="p-3 text-right w-32 pr-4">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {voucher.entries.map((entry) => {
                const isDebit = entry.amount > 0;
                return (
                  <tr key={entry.id}>
                    <td className="p-3 pl-4 font-bold text-slate-700">
                      {entry.ledger.name}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {isDebit ? entry.amount.toFixed(2) : ""}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 pr-4">
                      {!isDebit ? Math.abs(entry.amount).toFixed(2) : ""}
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL ROW */}
              <tr className="bg-gray-50 font-bold border-t border-gray-300">
                <td className="p-3 pl-4 text-right uppercase text-[10px] text-gray-500">
                  Total
                </td>
                <td className="p-3 text-right font-mono">
                  {voucher.entries
                    .filter((e) => e.amount > 0)
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)}
                </td>
                <td className="p-3 text-right font-mono pr-4">
                  {Math.abs(
                    voucher.entries
                      .filter((e) => e.amount < 0)
                      .reduce((sum, e) => sum + e.amount, 0)
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center pt-4">
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-gray-500 text-sm hover:text-black font-bold flex items-center gap-1"
          >
            <ArrowLeft size={16} /> BACK TO LIST
          </Link>

          <div className="flex gap-3">
            <Link
              href={`/companies/${companyId}/vouchers/${voucher.id}/print`}
              target="_blank"
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-black"
            >
              <Printer size={16} /> PRINT
            </Link>

            {!isMaker && !isApproved && (
              <VerifyActionBtn voucherId={voucher.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
