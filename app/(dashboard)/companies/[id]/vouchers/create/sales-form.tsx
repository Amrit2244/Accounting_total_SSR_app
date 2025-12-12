"use client";

import { useActionState, useState } from "react";
import { createVoucher } from "@/app/actions/voucher";
import Link from "next/link";

export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: any) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);
  const [rows, setRows] = useState([
    { id: 1, itemId: "", qty: "", rate: "", amount: 0 },
  ]);

  // --- LOGIC: Filter Ledgers based on Voucher Type ---
  const getPartyLedgers = () => {
    return ledgers.filter(
      (l: any) =>
        l.group.name === "Sundry Debtors" || l.group.name === "Sundry Creditors"
    );
  };

  const getAccountLedgers = () => {
    if (type === "SALES") {
      return ledgers.filter((l: any) => l.group.name === "Sales Accounts");
    } else {
      // PURCHASE
      return ledgers.filter((l: any) => l.group.name === "Purchase Accounts");
    }
  };

  // --- STYLING: Dynamic Colors ---
  const themeClass =
    type === "SALES"
      ? "bg-green-50 border-green-200"
      : "bg-yellow-50 border-yellow-200";
  const headerClass = type === "SALES" ? "bg-green-700" : "bg-yellow-600";

  // Helper Functions
  const updateRow = (id: number, field: string, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "qty" || field === "rate") {
          const q = parseFloat(updated.qty) || 0;
          const rt = parseFloat(updated.rate) || 0;
          updated.amount = q * rt;
        }
        return updated;
      })
    );
  };
  const addRow = () =>
    setRows([
      ...rows,
      { id: Date.now(), itemId: "", qty: "", rate: "", amount: 0 },
    ]);
  const removeRow = (id: number) => {
    if (rows.length > 1) setRows(rows.filter((r) => r.id !== id));
  };
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <form
      action={action}
      className={`space-y-6 p-6 rounded-lg border ${themeClass}`}
    >
      {state?.error && (
        <p className="text-red-900 bg-red-100 p-3 font-bold border border-red-300 rounded">
          {state.error}
        </p>
      )}

      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="inventoryRows" value={JSON.stringify(rows)} />
      <input
        type="hidden"
        name="date"
        value={new Date().toISOString().split("T")[0]}
      />

      {/* HEADER SECTION */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-extrabold text-black mb-1">
            Party A/c Name ({type === "SALES" ? "Buyer" : "Seller"})
          </label>
          <select
            name="partyLedgerId"
            className="w-full border border-gray-500 p-2.5 rounded font-bold text-black bg-white"
            required
          >
            <option value="">-- Select Party --</option>
            {getPartyLedgers().map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1 font-semibold">
            * Shows Debtors & Creditors only
          </p>
        </div>
        <div>
          <label className="block text-sm font-extrabold text-black mb-1">
            {type === "SALES" ? "Sales Ledger" : "Purchase Ledger"}
          </label>
          <select
            name="salesPurchaseLedgerId"
            className="w-full border border-gray-500 p-2.5 rounded font-bold text-black bg-white"
            required
          >
            <option value="">-- Select Account --</option>
            {getAccountLedgers().map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="border border-gray-400 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead
            className={`${headerClass} text-white text-sm font-extrabold uppercase`}
          >
            <tr>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3 text-right w-24">Qty</th>
              <th className="px-4 py-3 text-right w-32">Rate</th>
              <th className="px-4 py-3 text-right w-40">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="p-2">
                  <select
                    value={row.itemId}
                    onChange={(e) =>
                      updateRow(row.id, "itemId", e.target.value)
                    }
                    className="w-full border border-gray-400 p-2 rounded text-black font-medium"
                    required
                  >
                    <option value="">Select Item...</option>
                    {items.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                    className="w-full border border-gray-400 p-2 rounded text-right text-black font-bold"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={row.rate}
                    onChange={(e) => updateRow(row.id, "rate", e.target.value)}
                    className="w-full border border-gray-400 p-2 rounded text-right text-black font-bold"
                  />
                </td>
                <td className="p-2 text-right font-extrabold text-black text-lg">
                  {row.amount.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-gray-400 hover:text-red-600 font-bold text-xl"
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
                colSpan={3}
                className="px-4 py-3 cursor-pointer hover:bg-gray-300 text-blue-900"
                onClick={addRow}
              >
                + Add Item Row
              </td>
              <td className="px-4 py-3 text-right text-xl font-extrabold">
                {totalAmount.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* FOOTER */}
      <div>
        <label className="block text-sm font-bold text-black mb-1">
          Narration
        </label>
        <textarea
          name="narration"
          rows={2}
          className="w-full border border-gray-500 p-2 rounded text-black font-medium"
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
          disabled={isPending}
          className="flex-1 bg-black text-white px-6 py-3 rounded font-bold hover:bg-gray-800 text-lg"
        >
          {isPending ? "Saving..." : "Save Invoice"}
        </button>
      </div>
    </form>
  );
}
