import { prisma } from "@/lib/prisma";
import { getVoucherByCode } from "@/app/actions/voucher";
import VerifyActionBtn from "./verify-action-btn";
import Link from "next/link";
import { ShieldCheck, Ban, ArrowLeft, User } from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// ✅ key must match actions/voucher.ts exactly
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

  // 1. Fetch Voucher
  const voucher = await getVoucherByCode(code, companyId);

  // 2. Auth Check (Robust Error Handling)
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let currentUserId = 0;

  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey);
      currentUserId = parseInt(payload.userId as string);
    } catch (e) {
      console.log("Session verification failed. Treating as guest.");
      // We don't crash the app, just treat user as not logged in
    }
  }

  if (!voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-10 text-center border border-red-200 shadow-xl rounded-lg max-w-md">
          <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-red-600">
            <Ban size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Invalid Transaction ID
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            The code{" "}
            <span className="font-mono font-bold text-red-600">{code}</span>{" "}
            does not exist or has been deleted.
          </p>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="block w-full bg-slate-800 text-white py-3 rounded font-bold hover:bg-black transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isMaker = voucher.createdById === currentUserId;
  const isApproved = voucher.status === "APPROVED";

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white border-2 border-[#003366] shadow-xl rounded-sm overflow-hidden mb-10">
      {/* HEADER */}
      <div className="bg-[#003366] text-white p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-widest flex items-center gap-2">
            <ShieldCheck size={24} className="text-yellow-400" />
            VERIFICATION TERMINAL
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Transaction ID:{" "}
            <span className="text-yellow-400 font-mono text-lg font-bold ml-1">
              {code}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">VOUCHER NO</div>
          <div className="text-lg font-bold">
            {voucher.type} #{voucher.voucherNo}
          </div>
        </div>
      </div>

      {/* READ ONLY FORM */}
      <div className="p-8 space-y-6 bg-slate-50">
        {/* Status Banner */}
        {isApproved && (
          <div className="bg-green-100 text-green-800 p-4 border border-green-300 font-bold text-center rounded shadow-sm flex items-center justify-center gap-2">
            <ShieldCheck size={20} />
            THIS TRANSACTION IS VERIFIED AND POSTED.
          </div>
        )}

        {isMaker && !isApproved && (
          <div className="bg-red-100 text-red-800 p-4 border border-red-300 font-bold text-center rounded flex items-center justify-center gap-2 shadow-sm">
            <Ban size={18} /> SECURITY ALERT: YOU CANNOT VERIFY YOUR OWN ENTRY.
          </div>
        )}

        {!isMaker && !isApproved && currentUserId === 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-4 border border-yellow-300 font-bold text-center rounded shadow-sm">
            LOGIN REQUIRED TO VERIFY THIS TRANSACTION.
          </div>
        )}

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-4 border border-gray-300 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-gray-100 rounded-bl text-gray-400">
              <User size={12} />
            </div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Created By
            </label>
            <div className="font-bold text-slate-800 mt-1">
              {voucher.createdBy?.username || "Unknown"}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-300 shadow-sm">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Transaction Date
            </label>
            <div className="font-bold text-slate-800 mt-1">
              {voucher.date.toLocaleDateString()}
            </div>
          </div>
          <div className="col-span-2 bg-white p-4 border border-gray-300 shadow-sm">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Narration
            </label>
            <div className="font-bold text-slate-800 mt-1 italic">
              "{voucher.narration || "No narration provided"}"
            </div>
          </div>
        </div>

        {/* Accounting Entries Table */}
        {voucher.entries.length > 0 && (
          <div className="border border-gray-300 bg-white shadow-sm">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-xs font-bold text-gray-600 uppercase">
              Accounting Impact
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[#003366] border-b border-gray-200 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 pl-4">Ledger</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right pr-4">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voucher.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 pl-4 font-bold text-slate-700">
                      {e.ledger.name}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900">
                      {e.amount > 0 ? e.amount.toFixed(2) : "-"}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 pr-4">
                      {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory Entries Table (If any) */}
        {voucher.inventory && voucher.inventory.length > 0 && (
          <div className="border border-gray-300 bg-white shadow-sm mt-4">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-xs font-bold text-gray-600 uppercase">
              Inventory Details
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[#003366] border-b border-gray-200 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 pl-4">Item Name</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right pr-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voucher.inventory.map((item) => (
                  <tr key={item.id}>
                    {/* Note: We need to fetch item name via relation or use ID if not included. 
                                        If 'item' relation isn't fetched, this might be blank. 
                                        Ensure getVoucherByCode includes inventory: { include: { item: true } } if possible, 
                                        but for now we might only have IDs if not updated. */}
                    <td className="p-3 pl-4 font-bold text-slate-700">
                      Item #{item.itemId}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {Math.abs(item.quantity)}
                    </td>
                    <td className="p-3 text-right font-mono">
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
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-300">
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-gray-500 font-bold text-xs flex items-center gap-1 hover:text-[#003366] transition-colors"
          >
            <ArrowLeft size={14} /> CANCEL / BACK
          </Link>

          {/* VERIFY BUTTON LOGIC */}
          {!isMaker && !isApproved && currentUserId !== 0 && (
            <VerifyActionBtn voucherId={voucher.id} />
          )}
        </div>
      </div>
    </div>
  );
}
