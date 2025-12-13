"use client";

import { useActionState } from "react";
import { updateLedger } from "@/app/actions/masters";
import { Save, AlertCircle } from "lucide-react";

type Props = {
  companyId: number;
  ledger: {
    id: number;
    name: string;
    groupId: number;
    openingBalance: number;
    gstin: string | null;
    state: string | null;
  };
  groups: { id: number; name: string }[];
};

export default function EditLedgerForm({ companyId, ledger, groups }: Props) {
  const [state, action, isPending] = useActionState(updateLedger, undefined);

  // Determine Dr/Cr
  const isCr = ledger.openingBalance < 0;
  const absBalance = Math.abs(ledger.openingBalance);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="id" value={ledger.id} />

      {/* Error Banner */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={16} /> {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Ledger Name
        </label>
        <input
          name="name"
          type="text"
          defaultValue={ledger.name}
          required
          className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Parent Group
        </label>
        <select
          name="groupId"
          defaultValue={ledger.groupId}
          className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366] bg-white"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* GST Fields */}
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
            className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366]"
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
            className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366]"
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
            className="w-full border border-gray-300 p-2 rounded font-bold text-right outline-none focus:border-[#003366]"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Dr / Cr
          </label>
          <select
            name="openingType"
            defaultValue={isCr ? "Cr" : "Dr"}
            className="w-full border border-gray-300 p-2 rounded font-bold outline-none focus:border-[#003366] bg-white"
          >
            <option value="Dr">Dr</option>
            <option value="Cr">Cr</option>
          </select>
        </div>
      </div>

      <button
        disabled={isPending}
        className="bg-[#003366] text-white w-full py-3 rounded-lg font-bold shadow hover:bg-blue-900 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? (
          "Saving..."
        ) : (
          <>
            <Save size={18} /> UPDATE LEDGER
          </>
        )}
      </button>
    </form>
  );
}
