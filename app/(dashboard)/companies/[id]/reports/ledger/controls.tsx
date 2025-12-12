"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

type Props = {
  companyId: number;
  ledgers: { id: number; name: string }[];
  defaultLedgerId?: string;
  defaultFrom: string;
  defaultTo: string;
};

export default function LedgerControls({
  companyId,
  ledgers,
  defaultLedgerId,
  defaultFrom,
  defaultTo,
}: Props) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Find the form and submit it automatically when dropdown changes
    e.target.form?.requestSubmit();
  };

  return (
    <form className="flex flex-wrap items-end gap-4">
      {/* Hidden inputs to keep state in URL */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">
          Select Ledger
        </label>
        <select
          name="ledgerId"
          defaultValue={defaultLedgerId}
          className="border border-gray-400 p-2 rounded text-sm w-64 font-bold h-9"
          onChange={handleChange}
        >
          <option value="">-- Select Account --</option>
          {ledgers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">
          From
        </label>
        <input
          name="from"
          type="date"
          defaultValue={defaultFrom}
          className="border border-gray-400 p-2 rounded text-sm font-bold h-9"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">
          To
        </label>
        <input
          name="to"
          type="date"
          defaultValue={defaultTo}
          className="border border-gray-400 p-2 rounded text-sm font-bold h-9"
        />
      </div>

      <button
        type="submit"
        className="bg-[#003366] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-900 h-9"
      >
        <Search size={16} /> GO
      </button>

      <Link
        href={`/companies/${companyId}/reports`}
        className="ml-auto text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 h-9"
      >
        <ArrowLeft size={14} /> Back to Reports
      </Link>
    </form>
  );
}
