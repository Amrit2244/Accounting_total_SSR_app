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
  Package,
} from "lucide-react";
import Link from "next/link";

type Ledger = {
  id: number;
  name: string;
  group: { name: string };
};

type Props = {
  companyId: number;
  type: string;
  ledgers: Ledger[];
  items: { id: number; name: string }[];
};

export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);
  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [rows, setRows] = useState([
    { itemId: "", qty: "", rate: "", amount: 0 },
  ]);

  // --- 💡 CORE LOGIC: FILTER DROPDOWNS ---

  // 1. Filter Party Ledgers
  const partyLedgers = useMemo(() => {
    return ledgers.filter((l) => {
      const g = l.group.name.toLowerCase();
      // Allow Debtors, Creditors, Cash, Bank
      return (
        g.includes("debtor") ||
        g.includes("creditor") ||
        g.includes("cash") ||
        g.includes("bank")
      );
    });
  }, [ledgers]);

  // 2. Filter Account Ledgers (Sales / Purchase)
  const accountLedgers = useMemo(() => {
    return ledgers.filter((l) => {
      const g = l.group.name.toLowerCase();
      if (type === "SALES") return g.includes("sales") || g.includes("income");
      if (type === "PURCHASE")
        return g.includes("purchase") || g.includes("expense");
      return true;
    });
  }, [ledgers, type]);

  // ... (Standard Form Logic - Updates, Adds, Removes, Totals) ...
  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    /* @ts-ignore */ newRows[index][field] = value;
    const q = parseFloat(newRows[index].qty) || 0;
    const r = parseFloat(newRows[index].rate) || 0;
    newRows[index].amount = q * r;
    setRows(newRows);
  };
  const addRow = () =>
    setRows([...rows, { itemId: "", qty: "", rate: "", amount: 0 }]);
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const n = [...rows];
      n.splice(index, 1);
      setRows(n);
    }
  };
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  // ... (Success State - Same as before) ...
  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-green-50/50 border-2 border-dashed border-green-200 rounded-2xl">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-[#003366] mb-2">
          {type} Invoice Created
        </h2>
        <p className="text-slate-500 mb-8">
          Authorization required. Share this Transaction ID with the Approver.
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

  return (
    <form action={action} className="w-full h-full flex flex-col">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="inventoryRows" value={JSON.stringify(rows)} />
      <input type="hidden" name="partyLedgerId" value={partyId} />
      <input type="hidden" name="salesPurchaseLedgerId" value={accountId} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />{" "}
          <span className="font-bold">{state.error}</span>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Invoice Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            className="w-full border border-slate-300 p-2.5 rounded font-bold"
          />
        </div>
        <div>
          {/* ✅ FILTERED PARTY LIST */}
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Party A/c Name
          </label>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            required
            className="w-full border border-slate-300 p-2.5 rounded font-bold"
          >
            <option value="">Select Party</option>
            {partyLedgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.group.name})
              </option>
            ))}
          </select>
        </div>
        <div>
          {/* ✅ FILTERED ACCOUNT LIST */}
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            {type} Ledger
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full border border-slate-300 p-2.5 rounded font-bold"
          >
            <option value="">Select {type} Account</option>
            {accountLedgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.group.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-12 bg-[#003366] text-white p-3 text-xs font-bold uppercase tracking-wide">
          <div className="col-span-4 pl-2">Name of Item</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right pr-4">Amount</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="divide-y divide-slate-200 overflow-y-auto bg-white max-h-[400px]">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-12 p-2 items-center hover:bg-blue-50 transition-colors"
            >
              <div className="col-span-4 px-2">
                <select
                  value={row.itemId}
                  onChange={(e) => updateRow(index, "itemId", e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 px-2">
                <input
                  type="number"
                  step="0.01"
                  value={row.qty}
                  onChange={(e) => updateRow(index, "qty", e.target.value)}
                  placeholder="0"
                  className="w-full text-right p-2 border border-slate-300 rounded font-mono font-bold focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-2 px-2">
                <input
                  type="number"
                  step="0.01"
                  value={row.rate}
                  onChange={(e) => updateRow(index, "rate", e.target.value)}
                  placeholder="0.00"
                  className="w-full text-right p-2 border border-slate-300 rounded font-mono font-bold focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-3 px-2 text-right pr-4 font-mono font-bold text-slate-800">
                {row.amount.toFixed(2)}
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
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-2 p-3 text-sm font-bold text-white bg-slate-500 hover:bg-slate-600 transition-colors"
        >
          <Plus size={16} /> Add Inventory Line
        </button>
      </div>

      <div className="mt-6 flex justify-between items-start">
        <div className="w-1/2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Narration
          </label>
          <textarea
            name="narration"
            rows={3}
            className="w-full border border-slate-300 p-3 rounded-lg font-medium outline-none focus:border-blue-500"
            placeholder="Enter invoice details..."
          ></textarea>
        </div>
        <div className="bg-[#003366] text-white p-6 rounded-lg shadow-lg min-w-[300px]">
          <div className="flex justify-between items-center text-sm font-bold opacity-80 mb-2">
            <span>Total Qty:</span>
            <span>
              {rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between items-end border-t border-white/20 pt-2">
            <span className="text-lg font-bold">Grand Total</span>
            <span className="text-3xl font-mono font-bold text-yellow-400">
              {totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={isPending || totalAmount === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-transform hover:-translate-y-1"
        >
          {isPending ? (
            "Processing..."
          ) : (
            <>
              <Save size={24} /> SAVE INVOICE
            </>
          )}
        </button>
      </div>
    </form>
  );
}
