import { prisma } from "@/lib/prisma";
import { createLedger } from "@/app/actions/account";
import Link from "next/link";
import { ArrowLeft, Check, BookOpen, Layers } from "lucide-react";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);
  const groups = await prisma.Group.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl mx-auto py-4">
      <div className="mb-4">
        <h1 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2">
          <BookOpen className="text-blue-600" size={20} /> New Ledger Entry
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <form action={createLedger} className="p-5 space-y-4">
          <input type="hidden" name="companyId" value={companyId} />

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Ledger Name *
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="HDFC Bank, Sales A/c, etc."
                className="w-full px-3 py-2 rounded border border-slate-200 text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Under Group *
              </label>
              <select
                name="groupId"
                required
                className="w-full px-3 py-2 rounded border border-slate-200 text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50"
              >
                <option value="">Select Group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.nature})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Opening Bal (₹)
              </label>
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                defaultValue="0"
                className="w-full px-3 py-2 rounded border border-slate-200 text-xs font-mono font-bold text-right outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Type
              </label>
              <select
                name="balanceType"
                className="w-full px-3 py-2 rounded border border-slate-200 text-xs font-bold outline-none"
              >
                <option value="Dr">Debit</option>
                <option value="Cr">Credit</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={`/companies/${companyId}/chart-of-accounts`}
              className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </Link>
            <button className="px-6 py-2 bg-[#003366] text-white text-[10px] font-black uppercase rounded shadow-lg hover:bg-black transition-all flex items-center gap-2">
              <Check size={14} /> Save Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
