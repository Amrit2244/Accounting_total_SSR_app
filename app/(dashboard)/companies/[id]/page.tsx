import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Clock, CheckCircle } from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import VerifyBtn from "@/components/VerifyBtn"; // Import the new component

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

  // 1. Get Current User ID safely
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let currentUserId: number | null = null;

  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey);
      currentUserId = parseInt(payload.userId as string);
    } catch (e) {}
  }

  // 2. Fetch Vouchers
  const vouchers = await prisma.voucher.findMany({
    where: { companyId },
    include: {
      entries: { include: { ledger: true } },
      createdBy: true,
    },
    orderBy: { date: "desc" },
  });

  const getTotal = (entries: any[]) =>
    entries.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0);

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex justify-between items-center bg-white p-4 border border-gray-300 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-[#003366] flex items-center gap-2">
            <FileTextIcon /> TRANSACTION DAYBOOK
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Review and verify daily entries
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/vouchers/create`}
          className="bg-[#004b8d] hover:bg-[#003366] text-white px-4 py-2 text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={14} />
          ADD VOUCHER
        </Link>
      </div>

      {/* Enterprise Table */}
      <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#e6f0ff] border-b border-gray-300 text-[11px] font-bold text-[#003366] uppercase">
            <tr>
              <th className="px-4 py-3 border-r border-gray-200">Date</th>
              <th className="px-4 py-3 border-r border-gray-200">Ref No</th>
              <th className="px-4 py-3 border-r border-gray-200">
                Particulars
              </th>
              <th className="px-4 py-3 text-right border-r border-gray-200">
                Amount
              </th>
              <th className="px-4 py-3 text-center border-r border-gray-200">
                Status
              </th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-yellow-50 transition-colors">
                <td className="px-4 py-3 font-medium border-r border-gray-100">
                  {v.date.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-bold text-[#003366] border-r border-gray-100">
                  {v.type} #{v.voucherNo}
                </td>
                <td className="px-4 py-3 border-r border-gray-100">
                  <div className="font-bold text-gray-900">
                    {v.entries[0]?.ledger.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Created by:{" "}
                    <span className="font-bold">{v.createdBy.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-right text-black border-r border-gray-100 font-mono">
                  {getTotal(v.entries).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 text-center border-r border-gray-100">
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
                <td className="px-4 py-3 text-center">
                  {/* LOGIC: Show Verify button ONLY if status is PENDING AND current user is NOT the creator */}
                  {v.status === "PENDING" && currentUserId !== v.createdById ? (
                    <VerifyBtn voucherId={v.id} />
                  ) : v.status === "PENDING" ? (
                    <span className="text-[10px] text-gray-400 italic">
                      Self-Entry
                    </span>
                  ) : (
                    <span className="text-[10px] text-green-700 font-bold">
                      LOCKED
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-gray-500 italic"
                >
                  No records found in system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
