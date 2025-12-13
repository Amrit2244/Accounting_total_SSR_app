import { prisma } from "@/lib/prisma";
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

  if (!voucher) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Invalid Transaction ID
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

      {/* BODY */}
      <div className="p-8 space-y-6 bg-slate-50">
        {/* Status Banner */}
        {isApproved ? (
          <div className="bg-green-100 text-green-800 p-4 border border-green-300 font-bold text-center rounded shadow-sm flex items-center justify-center gap-2">
            <ShieldCheck size={20} /> VERIFIED AND POSTED
          </div>
        ) : isMaker ? (
          <div className="bg-orange-50 text-orange-800 p-4 border border-orange-200 font-bold text-center rounded flex flex-col items-center justify-center gap-1 shadow-sm">
            <div className="flex items-center gap-2">
              <Ban size={18} /> MAKER RESTRICTION ACTIVE
            </div>
            <p className="text-xs font-normal opacity-80">
              You created this entry. Please ask another Admin/Checker to verify
              it.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 text-blue-800 p-4 border border-blue-200 font-bold text-center rounded shadow-sm flex items-center justify-center gap-2">
            <Clock size={20} /> ACTION REQUIRED: VERIFY DETAILS
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-4 border border-gray-300 shadow-sm relative">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Created By
            </label>
            <div className="font-bold text-slate-800 mt-1 flex items-center gap-2">
              <User size={14} className="text-blue-500" />{" "}
              {voucher.createdBy?.username || "Unknown"}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-300 shadow-sm">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Date
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
              "{voucher.narration}"
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="border border-gray-300 bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 pl-4">Particulars</th>
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
                  <td className="p-3 text-right font-mono">
                    {e.amount > 0 ? e.amount.toFixed(2) : "-"}
                  </td>
                  <td className="p-3 text-right font-mono pr-4">
                    {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory Table (If exists) */}
        {voucher.inventory.length > 0 && (
          <div className="border border-gray-300 bg-white shadow-sm mt-4">
            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 uppercase border-b">
              Inventory
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {voucher.inventory.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100">
                    <td className="p-2 font-bold">
                      {i.item?.name || `Item ${i.itemId}`}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {Math.abs(i.quantity)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {i.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTIONS FOOTER */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-300">
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="text-gray-500 font-bold text-xs flex items-center gap-1 hover:text-[#003366]"
          >
            <ArrowLeft size={14} /> CANCEL
          </Link>

          <div className="flex gap-3">
            {/* Always Show Print Button */}
            <Link
              href={`/companies/${companyId}/vouchers/${voucher.id}/print`}
              target="_blank"
              className="bg-slate-700 hover:bg-black text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2"
            >
              <Printer size={14} /> PRINT
            </Link>

            {/* Verify Button (Only if NOT Maker and NOT Approved) */}
            {!isMaker && !isApproved && (
              <VerifyActionBtn voucherId={voucher.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
