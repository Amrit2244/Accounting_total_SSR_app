import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Clock, FileText, CheckCircle } from "lucide-react";
import { verifyVoucher } from "@/app/actions/voucher";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export default async function VoucherListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Auth Check for Verify Button
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let currentUserId: number | null = null;
  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey);
      currentUserId = parseInt(payload.userId as string);
    } catch (e) {}
  }

  const vouchers = await prisma.voucher.findMany({
    where: { companyId },
    include: { entries: { include: { ledger: true } }, createdBy: true },
    orderBy: { date: "desc" },
  });

  const getTotal = (entries: any[]) =>
    entries.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Daybook</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            View and manage daily transactions
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/vouchers/create`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} />
          New Voucher
        </Link>
      </div>

      {/* Modern Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Voucher No</th>
              <th className="px-6 py-4">Particulars</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-blue-50/50 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                  {v.date.toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                    {v.type} #{v.voucherNo}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="font-bold text-slate-900">
                    {v.entries[0]?.ledger.name}
                  </div>
                  {v.entries.length > 2 && (
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">
                      + {v.entries.length - 1} others
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-extrabold text-right text-slate-900 font-mono">
                  {getTotal(v.entries).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-4 text-center">
                  {v.status === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle size={10} /> APPROVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock size={10} /> PENDING
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {v.status === "PENDING" && currentUserId !== v.createdById ? (
                    <form action={verifyVoucher.bind(null, v.id)}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded shadow-sm transition-all">
                        Verify
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-400 italic font-medium"
                >
                  No transactions found. Start by creating a voucher.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
