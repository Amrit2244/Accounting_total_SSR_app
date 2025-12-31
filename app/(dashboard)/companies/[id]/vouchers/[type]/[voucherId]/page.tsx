import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileText,
  User,
  Package,
  Layers,
  ChevronRight,
  Receipt,
  Quote,
} from "lucide-react";
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

  // Helper to fetch based on model
  const fetcher = async (model: any) => {
    return model.findUnique({
      where,
      include: {
        ledgerEntries: ledgerRel,
        // Only include inventory if the model supports it
        ...(["SALES", "PURCHASE", "STOCK_JOURNAL"].includes(t)
          ? { inventoryEntries: invRel }
          : {}),
        createdBy: true,
      },
    });
  };

  switch (t) {
    case "SALES":
      return fetcher(prisma.salesVoucher);
    case "PURCHASE":
      return fetcher(prisma.purchaseVoucher);
    case "PAYMENT":
      return fetcher(prisma.paymentVoucher);
    case "RECEIPT":
      return fetcher(prisma.receiptVoucher);
    case "CONTRA":
      return fetcher(prisma.contraVoucher);
    case "JOURNAL":
      return fetcher(prisma.journalVoucher);
    case "STOCK_JOURNAL":
      return fetcher(prisma.stockJournal);
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
  const companyId = parseInt(p.id);
  const voucherId = parseInt(p.voucherId);
  const type = p.type;

  const voucher: any = await getVoucherDetails(companyId, type, voucherId);

  if (!voucher) notFound();

  const currentUser = await getCurrentUserId();
  const isCreator = voucher.createdById === currentUser;
  const isPending = voucher.status === "PENDING";

  // --- FIX 1: DEDUPLICATE LEDGER ENTRIES ---
  // If import created duplicates, we merge them here by Ledger ID
  const rawLedgers = voucher.ledgerEntries || [];
  const mergedLedgers = Object.values(
    rawLedgers.reduce((acc: any, curr: any) => {
      const id = curr.ledgerId;
      if (!acc[id]) {
        acc[id] = { ...curr, amount: 0 };
      }
      acc[id].amount += curr.amount;
      return acc;
    }, {})
  );

  const inventoryEntries = voucher.inventoryEntries || [];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/vouchers`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Vouchers"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {type}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    voucher.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : voucher.status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}
                >
                  {voucher.status}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt size={20} className="text-slate-400" />#
                {voucher.voucherNo}
              </h1>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                TXID: {voucher.transactionCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${companyId}/vouchers/${type}/${voucherId}/print`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Printer size={16} />
              <span>Print</span>
            </Link>

            {isPending && (
              <VerifyBtn
                voucherId={voucher.id}
                type={type}
                isCreator={isCreator}
                companyId={companyId}
              />
            )}
          </div>
        </div>

        {/* METADATA CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-100">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Date
              </label>
              <p className="text-sm font-bold text-slate-900">
                {format(new Date(voucher.date), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Amount
              </label>
              <p className="text-sm font-bold font-mono text-slate-900">
                ₹{(voucher.totalAmount || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Created By
              </label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <User size={12} />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {voucher.createdBy?.name || "Unknown User"}
                  {isCreator && (
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">
                      (You)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* LEDGER ENTRIES TABLE (Deduped) */}
          {mergedLedgers.length > 0 && (
            <div className="p-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" /> Ledger Accounts
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-20 text-center">Type</th>
                      <th className="px-4 py-3">Particulars</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Explicitly cast mapped items to any to resolve TS errors */}
                    {(mergedLedgers as any[]).map((entry: any, idx: number) => {
                      // --- FIX 2: DR/CR LOGIC ---
                      // Negative = Debit (Dr), Positive = Credit (Cr)
                      // If amount is 0, we hide it or show Dr based on context, but usually it shouldn't be 0
                      const isDebit = entry.amount < 0;
                      const absAmount = Math.abs(entry.amount);

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${
                                isDebit
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              }`}
                            >
                              {isDebit ? "Dr" : "Cr"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-700 text-sm">
                              {entry.ledger?.name || "Unknown Ledger"}
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold text-xs ${
                              isDebit ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {absAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVENTORY TABLE */}
          {inventoryEntries.length > 0 && (
            <div className="p-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={14} className="text-indigo-600" /> Inventory
                Items
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventoryEntries.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {item.stockItem?.name || "Unknown Item"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">
                          {Math.abs(item.quantity)}{" "}
                          <span className="text-slate-400 text-[9px] ml-0.5">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">
                          {item.rate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-xs">
                          {item.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NARRATION */}
          {voucher.narration && (
            <div className="px-6 pb-6 border-t border-slate-100 pt-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs flex gap-3 items-start">
                <Quote size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="italic">"{voucher.narration}"</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
