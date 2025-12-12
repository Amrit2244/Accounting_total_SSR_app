"use client";

import { useActionState } from "react";
import { createUnit } from "@/app/actions/inventory";
import Link from "next/link";

export default function CreateUnitForm({ companyId }: { companyId: number }) {
  const [state, action, isPending] = useActionState(createUnit, undefined);

  return (
    <form action={action} className="space-y-6">
      {/* Pass the unwrapped ID correctly */}
      <input type="hidden" name="companyId" value={companyId} />

      {state?.error && (
        <p className="text-red-700 bg-red-100 p-2 rounded mb-4 font-bold border border-red-200">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="text-green-800 bg-green-100 p-2 rounded mb-4 font-bold border border-green-200">
          Unit Created Successfully!
        </p>
      )}

      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Symbol (e.g. Nos)
        </label>
        <input
          name="symbol"
          required
          placeholder="e.g. Kg, Pcs, Box"
          className="w-full border border-gray-400 p-2 rounded text-black font-medium focus:ring-2 focus:ring-black outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Formal Name (e.g. Numbers)
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Kilograms, Pieces"
          className="w-full border border-gray-400 p-2 rounded text-black font-medium focus:ring-2 focus:ring-black outline-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-4 py-2 border border-gray-400 rounded text-black font-bold hover:bg-gray-100"
        >
          Back
        </Link>
        <button
          disabled={isPending}
          className="flex-1 bg-black text-white py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Unit"}
        </button>
      </div>
    </form>
  );
}
