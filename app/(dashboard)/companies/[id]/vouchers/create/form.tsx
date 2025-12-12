"use client";

import { useActionState, useState } from "react";
import { createVoucher } from "@/app/actions/voucher";
import Link from "next/link";

type Ledger = { id: number; name: string; group: { name: string } };

export default function VoucherForm({
  companyId,
  ledgers,
  defaultType,
}: {
  companyId: number;
  ledgers: Ledger[];
  defaultType: string;
}) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);
  const [rows, setRows] = useState([
    { id: 1, type: "Dr", ledgerId: "", amount: "" },
    { id: 2, type: "Cr", ledgerId: "", amount: "" },
  ]);

  // Use the type passed from the parent (which resets due to the 'key' prop)
  const currentType = defaultType;

  // --- STRICT FILTERING LOGIC ---
  const getFilteredLedgers = (rowType: string) => {
    // Helper: Is this ledger a Cash or Bank account?
    // We check the Group Name.
    const isCashOrBank = (groupName: string) => {
      return ["Cash-in-hand", "Bank Accounts", "Bank OD A/c"].includes(
        groupName
      );
    };

    return ledgers.filter((l) => {
      const group = l.group.name;

      // 1. CONTRA: Both Dr & Cr must be Cash/Bank
      if (currentType === "CONTRA") {
        return isCashOrBank(group);
      }

      // 2. JOURNAL: No Cash/Bank allowed on either side
      if (currentType === "JOURNAL") {
        return !isCashOrBank(group);
      }

      // 3. PAYMENT: Cr must be Cash/Bank. Dr can be anything.
      if (currentType === "PAYMENT") {
        if (rowType === "Cr") return isCashOrBank(group); // Only Cash/Bank
        return true; // Dr can be anything
      }

      // 4. RECEIPT: Dr must be Cash/Bank. Cr can be anything.
      if (currentType === "RECEIPT") {
        if (rowType === "Dr") return isCashOrBank(group); // Only Cash/Bank
        return true; // Cr can be anything
      }

      return true; // Fallback
    });
  };

  // --- COLOR THEMES ---
  let themeClass = "bg-gray-50 border-gray-400";
  let headerClass = "bg-black";

  if (currentType === "CONTRA") {
    // Gray Theme
    themeClass = "bg-gray-100 border-gray-400";
    headerClass = "bg-gray-700";
  }
  if (currentType === "PAYMENT") {
    // Reddish Theme
    themeClass = "bg-red-50 border-red-300";
    headerClass = "bg-red-700";
  }
  if (currentType === "RECEIPT") {
    // Greenish Theme
    themeClass = "bg-green-50 border-green-300";
    headerClass = "bg-green-700";
  }
  if (currentType === "JOURNAL") {
    // Yellowish Theme
    themeClass = "bg-yellow-50 border-yellow-300";
    headerClass = "bg-yellow-600";
  }

  // Helpers
  const updateRow = (id: number, field: string, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };
  const addRow = () => {
    const lastType = rows[rows.length - 1].type;
    setRows([
      ...rows,
      {
        id: Date.now(),
        type: lastType === "Dr" ? "Cr" : "Dr",
        ledgerId: "",
        amount: "",
      },
    ]);
  };
  const removeRow = (id: number) => {
    if (rows.length > 2) setRows(rows.filter((r) => r.id !== id));
  };

  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = totalDr - totalCr;
  const isBalanced = Math.abs(diff) < 0.01;

  return (
    <form
      action={action}
      className={`space-y-6 p-6 rounded-lg border-2 ${themeClass}`}
    >
      {state?.error && (
        <div className="bg-red-100 text-red-900 p-3 rounded text-sm border border-red-200 font-bold">
          {state.error}
        </div>
      )}

      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {/* We submit the type explicitly */}
      <input type="hidden" name="type" value={currentType} />

      {/* TOP BAR */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm font-extrabold text-black mb-1">
            Voucher Type
          </label>
          <div
            className={`p-2 font-bold text-white rounded text-center uppercase tracking-widest ${headerClass}`}
          >
            {currentType}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-black mb-1">
            Date
          </label>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-400 p-2 rounded text-black font-bold focus:ring-2 focus:ring-black outline-none"
          />
        </div>
      </div>

      {/* DYNAMIC GRID */}
      <div className="border border-gray-400 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left">
          <thead
            className={`${headerClass} text-white text-sm uppercase font-extrabold`}
          >
            <tr>
              <th className="px-4 py-3 w-20">Type</th>
              <th className="px-4 py-3">Particulars (Ledger)</th>
              <th className="px-4 py-3 text-right w-40">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="p-2">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.id, "type", e.target.value)}
                    className="w-full font-extrabold border-none bg-transparent focus:ring-0 cursor-pointer text-black"
                  >
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={row.ledgerId}
                    onChange={(e) =>
                      updateRow(row.id, "ledgerId", e.target.value)
                    }
                    className="w-full border border-gray-400 rounded p-2 text-black font-medium focus:ring-2 focus:ring-black outline-none"
                    required
                  >
                    <option value="">Select Ledger...</option>
                    {getFilteredLedgers(row.type).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  {/* Helper text if list is empty due to filter */}
                  {getFilteredLedgers(row.type).length === 0 && (
                    <p className="text-xs text-red-600 font-bold mt-1">
                      No ledgers available for this side in {currentType}.
                    </p>
                  )}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.id, "amount", e.target.value)
                    }
                    className="w-full border border-gray-400 rounded p-2 text-right font-bold text-black"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-gray-400 hover:text-red-600 font-bold text-lg"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-200 font-bold border-t border-gray-400 text-black">
            <tr>
              <td
                colSpan={2}
                className="px-4 py-3 cursor-pointer hover:bg-gray-300 text-blue-900"
                onClick={addRow}
              >
                + Add Line
              </td>
              <td className="px-4 py-3 text-right">
                Dr: {totalDr.toFixed(2)} | Cr: {totalCr.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!isBalanced && (
        <div className="text-right text-red-600 font-extrabold text-sm animate-pulse">
          Difference: {Math.abs(diff).toFixed(2)}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Narration
        </label>
        <textarea
          name="narration"
          rows={2}
          className="w-full border border-gray-500 p-2 rounded bg-white text-black font-medium"
        ></textarea>
      </div>

      <div className="flex gap-4 pt-2">
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="px-6 py-3 border border-gray-500 rounded text-black font-bold hover:bg-gray-200"
        >
          Cancel
        </Link>
        <button
          disabled={isPending || !isBalanced}
          type="submit"
          className="flex-1 bg-black text-white px-6 py-3 rounded font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isPending ? "Saving..." : "Save Voucher"}
        </button>
      </div>
    </form>
  );
}
