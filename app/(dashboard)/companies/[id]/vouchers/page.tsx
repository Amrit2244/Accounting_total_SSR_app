import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { verifyVoucher } from "@/app/actions/voucher"; // Import the action

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

  // 1. Get Current User ID
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
    include: {
      entries: { include: { ledger: true } },
      createdBy: true,
      verifiedBy: true,
    },
    orderBy: { date: "desc" },
  });

  const getTotal = (entries: any[]) =>
    entries.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0);

  return (
    <div className="max-w-6xl mx-auto mt-6">
      {/* Header ... same as before ... */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-black">Day Book</h1>
          <Link
            href={`/`}
            className="text-blue-700 font-medium hover:underline text-sm"
          >
            ← Dashboard
          </Link>
        </div>
        <Link
          href={`/companies/${companyId}/vouchers/create`}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 shadow-sm text-sm"
        >
          + Add Voucher
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-300">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-300 text-sm font-bold text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {v.date.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                  {v.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="font-bold text-black">{v.voucherNo}</div>
                  <div className="text-xs text-gray-400">
                    by {v.createdBy.username}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-right text-black">
                  {getTotal(v.entries).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${
                      v.status === "APPROVED"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {/* MAKER-CHECKER LOGIC */}
                  {v.status === "PENDING" && currentUserId !== v.createdById ? (
                    <form action={verifyVoucher.bind(null, v.id)}>
                      <button className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-green-700">
                        Verify
                      </button>
                    </form>
                  ) : v.status === "PENDING" ? (
                    <span className="text-xs text-gray-400 italic">
                      Waiting approval
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-bold">
                      ✓ Verified
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
