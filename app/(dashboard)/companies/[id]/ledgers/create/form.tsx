"use client";

import { useActionState } from "react";
import { createLedger } from "@/app/actions/master";
import Link from "next/link";

type Group = {
  id: number;
  name: string;
  nature: string;
};

export default function CreateLedgerForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  const [state, action, isPending] = useActionState(createLedger, undefined);

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="bg-red-100 text-red-900 p-3 rounded text-sm border border-red-200 font-medium">
          {state.error}
        </div>
      )}

      {/* Hidden Company ID */}
      <input type="hidden" name="companyId" value={companyId} />

      {/* Name Input */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-1">
          Ledger Name
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. HDFC Bank, Amit Traders"
          className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50 focus:ring-2 focus:ring-black outline-none"
        />
      </div>

      {/* Group Dropdown */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-1">
          Under Group
        </label>
        <select
          name="groupId"
          className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
          required
        >
          <option value="">-- Select Group --</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.nature})
            </option>
          ))}
        </select>
      </div>

      {/* Opening Balance Section */}
      <div className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded border border-gray-200">
        <div className="col-span-2">
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Opening Balance
          </label>
          <input
            name="openingBalance"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-gray-400 p-2 rounded text-black bg-white text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Dr / Cr
          </label>
          <select
            name="openingType"
            className="w-full border border-gray-400 p-2 rounded text-black bg-white"
          >
            <option value="Dr">Dr</option>
            <option value="Cr">Cr</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <Link
          href={`/companies/${companyId}/chart-of-accounts`}
          className="px-6 py-2 border border-gray-400 rounded text-black font-bold hover:bg-gray-200"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="flex-1 bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Create Ledger"}
        </button>
      </div>
    </form>
  );
}
