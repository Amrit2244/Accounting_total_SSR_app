import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";
import TransactionSearch from "@/components/TransactionSearch";
import DeleteButton from "@/components/DeleteButton";
import { deleteVoucher } from "@/app/actions/voucher"; // Existing action

export default async function VoucherListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const vouchers = await prisma.voucher.findMany({
    where: { companyId },
    include: { entries: { include: { ledger: true } }, createdBy: true },
    orderBy: { date: "desc" },
  });

  const getTotal = (entries: any[]) =>
    entries.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
        <div>
          <h1 className="text-lg font-bold text-[#003366] flex items-center gap-2">
            <FileText size={20} /> DAYBOOK
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Review and verify entries
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              Verify Transaction
            </label>
            <TransactionSearch companyId={companyId} />
          </div>
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          <Link
            href={`/companies/${companyId}/vouchers/create`}
            className="bg-[#004b8d] hover:bg-[#003366] text-white px-4 py-2 text-xs font-bold rounded shadow-sm flex items-center gap-2 h-10"
          >
            <Plus size={16} /> NEW ENTRY
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm overflow-hidden rounded-sm">
        <table className="w-full text-left">
          <thead className="bg-[#e6f0ff] border-b border-gray-300 text-[11px] font-bold text-[#003366] uppercase">
            <tr>
              <th className="px-4 py-3 border-r">Date</th>
              <th className="px-4 py-3 border-r">Ref No</th>
              <th className="px-4 py-3 border-r">Particulars</th>
              <th className="px-4 py-3 text-right border-r">Amount</th>
              <th className="px-4 py-3 text-center border-r">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-yellow-50 transition-colors">
                <td className="px-4 py-3 font-medium border-r">
                  {v.date.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-bold text-[#003366] border-r">
                  {v.type} #{v.voucherNo}
                </td>
                <td className="px-4 py-3 border-r">
                  <div className="font-bold text-gray-900">
                    {v.entries[0]?.ledger.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    By: {v.createdBy?.username}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-right font-mono border-r">
                  {getTotal(v.entries).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 text-center border-r">
                  {v.status === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold">
                      <CheckCircle size={10} /> AUTH
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold">
                      <Clock size={10} /> PENDING
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  {/* DELETE BUTTON */}
                  <DeleteButton
                    id={v.id}
                    companyId={companyId}
                    action={deleteVoucher}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
