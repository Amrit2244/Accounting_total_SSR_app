import { prisma } from "@/lib/prisma";
import { updateLedger } from "@/app/actions/masters"; // Ensure this path matches your file name
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditLedgerPage({
  params,
}: {
  params: Promise<{ id: string; ledgerId: string }>;
}) {
  const { id, ledgerId } = await params;
  const companyId = parseInt(id);
  const lId = parseInt(ledgerId);

  const ledger = await prisma.ledger.findUnique({ where: { id: lId } });
  const groups = await prisma.accountGroup.findMany();

  if (!ledger) return <div>Ledger not found</div>;

  const isCr = ledger.openingBalance < 0;
  const absBalance = Math.abs(ledger.openingBalance);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-300 rounded-lg mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#003366]">
          Edit Ledger: {ledger.name}
        </h1>
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <form action={updateLedger} className="space-y-6">
        <input type="hidden" name="companyId" value={companyId} />
        <input type="hidden" name="id" value={ledger.id} />

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Ledger Name
          </label>
          <input
            name="name"
            type="text"
            defaultValue={ledger.name}
            required
            className="w-full border border-gray-300 p-2 rounded font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Parent Group
          </label>
          <select
            name="groupId"
            defaultValue={ledger.groupId}
            className="w-full border border-gray-300 p-2 rounded font-bold"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* GST Fields (New) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              State
            </label>
            <input
              name="state"
              type="text"
              defaultValue={ledger.state || ""}
              placeholder="e.g. Maharashtra"
              className="w-full border border-gray-300 p-2 rounded font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              GSTIN
            </label>
            <input
              name="gstin"
              type="text"
              defaultValue={ledger.gstin || ""}
              placeholder="27ABC..."
              className="w-full border border-gray-300 p-2 rounded font-bold"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Opening Balance
            </label>
            <input
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue={absBalance}
              className="w-full border border-gray-300 p-2 rounded font-bold text-right"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Dr / Cr
            </label>
            <select
              name="openingType"
              defaultValue={isCr ? "Cr" : "Dr"}
              className="w-full border border-gray-300 p-2 rounded font-bold"
            >
              <option value="Dr">Dr</option>
              <option value="Cr">Cr</option>
            </select>
          </div>
        </div>

        <button className="bg-[#003366] text-white w-full py-3 rounded-lg font-bold shadow hover:bg-blue-900 flex items-center justify-center gap-2">
          <Save size={18} /> UPDATE LEDGER
        </button>
      </form>
    </div>
  );
}
