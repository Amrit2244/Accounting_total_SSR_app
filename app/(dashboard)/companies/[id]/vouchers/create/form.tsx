"use client";

import { useState, useActionState, useMemo } from "react"; // Added useMemo
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";

type Ledger = {
  id: number;
  name: string;
  group: { name: string };
};

type Props = {
  companyId: number;
  ledgers: Ledger[]; // Updated Type
  defaultType: string;
};

export default function VoucherForm({
  companyId,
  ledgers,
  defaultType,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);

  // Set initial rows based on type for convenience
  const initialRows =
    defaultType === "RECEIPT"
      ? [
          { ledgerId: "", type: "Cr", amount: "" },
          { ledgerId: "", type: "Dr", amount: "" },
        ] // Cr usually first in Tally for Receipt, but let's stick to standard
      : [
          { ledgerId: "", type: "Dr", amount: "" },
          { ledgerId: "", type: "Cr", amount: "" },
        ];

  const [rows, setRows] = useState(initialRows);

  // --- 💡 CORE LOGIC: FILTER DROPDOWN BASED ON VOUCHER RULES ---
  const getFilteredLedgers = (rowType: string) => {
    // Helper: Check if group is Cash or Bank
    const isCashOrBank = (groupName: string) => {
      const g = groupName.toLowerCase();
      return g.includes("cash") || g.includes("bank");
    };

    return ledgers.filter((ledger) => {
      const group = ledger.group.name;

      switch (defaultType) {
        case "CONTRA":
          // Rule: Both sides MUST be Cash or Bank
          return isCashOrBank(group);

        case "PAYMENT":
          // Rule: Money is going OUT.
          // CR (Source) MUST be Cash/Bank.
          // DR (Destination) can be anything EXCEPT Cash/Bank (usually).
          if (rowType === "Cr") return isCashOrBank(group);
          return true; // Allow all for Dr (Party, Expense, Asset), can block cash/bank if strict

        case "RECEIPT":
          // Rule: Money is coming IN.
          // DR (Destination) MUST be Cash/Bank.
          // CR (Source) can be anything.
          if (rowType === "Dr") return isCashOrBank(group);
          return true;

        case "JOURNAL":
          // Rule: Non-Cash adjustments.
          // NO Cash or Bank allowed.
          return !isCashOrBank(group);

        default:
          return true;
      }
    });
  };

  // ... (Success State Code - Same as before) ...
  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-[#003366] mb-2">
          Voucher Created Successfully
        </h2>
        <p className="text-slate-500 mb-8">
          The transaction is now <b>PENDING</b>. Please share the code below
          with an Approver.
        </p>
        <div
          className="bg-white border-2 border-[#003366] rounded-xl p-8 shadow-lg relative group cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => navigator.clipboard.writeText(state.code)}
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Transaction ID
          </p>
          <div className="text-6xl font-mono font-black text-[#003366] tracking-[0.2em]">
            {state.code}
          </div>
          <div className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500">
            <Copy size={20} />
          </div>
        </div>
        <div className="mt-10 flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-900 transition-colors"
          >
            Create Another
          </button>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="bg-white border border-gray-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Go to Daybook
          </Link>
        </div>
      </div>
    );
  }

  // ... (Standard Functions: addRow, removeRow, updateRow, calculations) ...
  const addRow = () =>
    setRows([...rows, { ledgerId: "", type: "Dr", amount: "" }]);
  const removeRow = (index: number) => {
    if (rows.length > 2) {
      const n = [...rows];
      n.splice(index, 1);
      setRows(n);
    }
  };
  const updateRow = (index: number, field: string, value: string) => {
    const n = [...rows];
    /* @ts-ignore */ n[index][field] = value;
    setRows(n);
  };
  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const difference = totalDr - totalCr;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <form action={action} className="w-full h-full flex flex-col">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />{" "}
          <span className="font-bold">{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Voucher Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            className="w-full border border-slate-300 p-3 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-[#003366] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Narration
          </label>
          <input
            name="narration"
            type="text"
            placeholder="Being amount paid for..."
            className="w-full border border-slate-300 p-3 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-[#003366] outline-none"
          />
        </div>
      </div>

      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 bg-slate-200 p-3 text-xs font-bold text-slate-600 uppercase">
          <div className="col-span-1 text-center">Dr/Cr</div>
          <div className="col-span-7 pl-4">Ledger Account</div>
          <div className="col-span-3 text-right pr-4">Amount</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        <div className="divide-y divide-slate-200 overflow-y-auto max-h-[400px]">
          {rows.map((row, index) => {
            // ✅ GET FILTERED OPTIONS FOR THIS SPECIFIC ROW
            const options = getFilteredLedgers(row.type);

            return (
              <div
                key={index}
                className="grid grid-cols-12 p-2 items-center hover:bg-white transition-colors"
              >
                <div className="col-span-1 px-2">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(index, "type", e.target.value)}
                    className={`w-full font-bold p-2 rounded border ${
                      row.type === "Dr"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-orange-700 bg-orange-50 border-orange-200"
                    }`}
                  >
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </div>
                <div className="col-span-7 px-2">
                  <select
                    value={row.ledgerId}
                    onChange={(e) =>
                      updateRow(index, "ledgerId", e.target.value)
                    }
                    className="w-full p-2 border border-slate-300 rounded font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Ledger</option>
                    {options.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.group.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 px-2">
                  <input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(index, "amount", e.target.value)}
                    placeholder="0.00"
                    className="w-full text-right p-2 border border-slate-300 rounded font-mono font-bold focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 p-3 text-sm font-bold text-blue-600 hover:bg-blue-50 border-t border-slate-200 transition-colors"
        >
          <Plus size={16} /> Add Line
        </button>
      </div>

      <div className="mt-6 flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200">
        <div className="text-sm space-y-1">
          <div className="text-slate-500">
            Total Debit:{" "}
            <span className="font-mono font-bold text-slate-800">
              {totalDr.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-500">
            Total Credit:{" "}
            <span className="font-mono font-bold text-slate-800">
              {totalCr.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isBalanced && (
            <span className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded border border-red-200">
              Difference: {Math.abs(difference).toFixed(2)}
            </span>
          )}
          <button
            disabled={!isBalanced || isPending}
            className="bg-[#003366] hover:bg-blue-900 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              "Processing..."
            ) : (
              <>
                <Save size={18} /> SAVE VOUCHER
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
