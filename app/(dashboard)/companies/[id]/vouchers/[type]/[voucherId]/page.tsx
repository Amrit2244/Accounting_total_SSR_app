import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, FileText, User } from "lucide-react";
import { format } from "date-fns";
import VerifyBtn from "@/components/VerifyBtn";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey);
    return typeof payload.userId === "string"
      ? parseInt(payload.userId)
      : (payload.userId as number);
  } catch {
    return null;
  }
}

async function getVoucherDetails(companyId: number, type: string, id: number) {
  const t = type.toUpperCase();
  const where = { id, companyId };

  const ledgerRel = { include: { ledger: true } };
  const invRel = { include: { stockItem: true } };

  switch (t) {
    case "SALES":
      return prisma.salesVoucher.findUnique({
        where,
        include: {
          ledgerEntries: ledgerRel,
          inventoryEntries: invRel,
          createdBy: true,
        },
      });
    case "PURCHASE":
      return prisma.purchaseVoucher.findUnique({
        where,
        include: {
          ledgerEntries: ledgerRel,
          inventoryEntries: invRel,
          createdBy: true,
        },
      });
    case "PAYMENT":
      return prisma.paymentVoucher.findUnique({
        where,
        include: { ledgerEntries: ledgerRel, createdBy: true },
      });
    case "RECEIPT":
      return prisma.receiptVoucher.findUnique({
        where,
        include: { ledgerEntries: ledgerRel, createdBy: true },
      });
    case "CONTRA":
      return prisma.contraVoucher.findUnique({
        where,
        include: { ledgerEntries: ledgerRel, createdBy: true },
      });
    case "JOURNAL":
      return prisma.journalVoucher.findUnique({
        where,
        include: { ledgerEntries: ledgerRel, createdBy: true },
      });
    case "STOCK_JOURNAL":
      return prisma.stockJournal.findUnique({
        where,
        include: { inventoryEntries: invRel, createdBy: true },
      });
    default:
      return null;
  }
}

export default async function VoucherDetailsPage({
  params,
}: {
  params: Promise<{ id: string; type: string; voucherId: string }>;
}) {
  const p = await params;

  // 'id' is the Company ID (from the first [id] folder)
  const companyId = parseInt(p.id);
  // 'voucherId' is the Voucher ID (from the last [voucherId] folder)
  const voucherId = parseInt(p.voucherId);
  const type = p.type;

  const voucher: any = await getVoucherDetails(companyId, type, voucherId);

  if (!voucher) notFound();

  const currentUser = await getCurrentUserId();
  const isCreator = voucher.createdById === currentUser;
  const isPending = voucher.status === "PENDING";

  const ledgerEntries = voucher.ledgerEntries || [];
  const inventoryEntries = voucher.inventoryEntries || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {type} Voucher
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  voucher.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : voucher.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {voucher.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              #{voucher.voucherNo}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              TXID: {voucher.transactionCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Printer size={16} /> Print
          </button>

          {isPending && (
            <VerifyBtn
              voucherId={voucher.id}
              type={type}
              isCreator={isCreator}
              companyId={companyId} // <--- ✅ ADD THIS LINE
            />
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* METADATA */}
        <div className="bg-slate-50/50 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Date
            </label>
            <p className="text-sm font-bold text-slate-800">
              {format(new Date(voucher.date), "dd MMM yyyy")}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Amount
            </label>
            <p className="text-sm font-bold text-slate-800">
              ₹{(voucher.totalAmount || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Created By
            </label>
            <div className="flex items-center gap-2 mt-1">
              <div className="p-1 bg-blue-100 text-blue-600 rounded-full">
                <User size={12} />
              </div>
              <p className="text-xs font-medium text-slate-700">
                {voucher.createdBy?.name || "Unknown User"}
                {isCreator && (
                  <span className="text-[10px] text-slate-400 ml-1">(You)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* LEDGERS */}
        {ledgerEntries.length > 0 && (
          <div className="p-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={14} /> Ledger Entries
            </h3>
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-4 py-2 w-16">Dr/Cr</th>
                  <th className="px-4 py-2">Particulars</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ledgerEntries.map((entry: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-bold text-slate-400">
                      {entry.amount > 0 ? "Dr" : "Cr"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {entry.ledger?.name || "Unknown Ledger"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {Math.abs(entry.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ITEMS */}
        {inventoryEntries.length > 0 && (
          <div className="p-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={14} /> Item Details
            </h3>
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-4 py-2">Item Name</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventoryEntries.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.stockItem?.name}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {Math.abs(item.quantity)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.rate}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {item.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NARRATION */}
        {voucher.narration && (
          <div className="bg-yellow-50/50 p-4 border-t border-slate-100 text-xs text-slate-600 italic">
            <span className="font-bold not-italic text-slate-400 mr-2">
              Narration:
            </span>
            {voucher.narration}
          </div>
        )}
      </div>
    </div>
  );
}
