"use client";

import { useState, useActionState, useMemo } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Copy,
  Printer,
  Settings2,
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
  items: { id: number; name: string; gstRate: number }[];
};

export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);

  // Form State
  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [enableTax, setEnableTax] = useState(false);
  const [taxLedgerId, setTaxLedgerId] = useState("");

  // Rows State
  const [rows, setRows] = useState([
    { itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 },
  ]);

  // --- FILTER LEDGERS ---
  const partyLedgers = useMemo(
    () =>
      ledgers.filter((l) => {
        const g = l.group.name.toLowerCase();
        return (
          g.includes("debtor") ||
          g.includes("creditor") ||
          g.includes("cash") ||
          g.includes("bank")
        );
      }),
    [ledgers]
  );

  const accountLedgers = useMemo(
    () =>
      ledgers.filter((l) => {
        const g = l.group.name.toLowerCase();
        if (type === "SALES")
          return g.includes("sales") || g.includes("income");
        if (type === "PURCHASE")
          return g.includes("purchase") || g.includes("expense");
        return true;
      }),
    [ledgers, type]
  );

  const taxLedgers = useMemo(
    () =>
      ledgers.filter(
        (l) =>
          l.group.name.toLowerCase().includes("duties") ||
          l.group.name.toLowerCase().includes("tax")
      ),
    [ledgers]
  );

  // --- ROW LOGIC ---
  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    /* @ts-ignore */
    newRows[index][field] = value;

    if (field === "itemId") {
      const selectedItem = items.find((i) => i.id.toString() === value);
      if (selectedItem) {
        newRows[index].gst = selectedItem.gstRate || 0;
      }
    }

    const q = parseFloat(newRows[index].qty) || 0;
    const r = parseFloat(newRows[index].rate) || 0;
    const g = newRows[index].gst || 0;

    const baseAmount = q * r;
    newRows[index].amount = baseAmount;
    newRows[index].taxAmount = baseAmount * (g / 100);

    setRows(newRows);
  };

  const addRow = () =>
    setRows([
      ...rows,
      { itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 },
    ]);
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const n = [...rows];
      n.splice(index, 1);
      setRows(n);
    }
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  // --- SUCCESS SCREEN ---
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
          {state.id && (
            <Link
              href={`/companies/${companyId}/vouchers/${state.id}/print`}
              target="_blank"
              className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-black transition-colors flex items-center gap-2"
            >
              <Printer size={18} /> Print Invoice
            </Link>
          )}
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
    <form action={action} className="w-full h-full flex flex-col font-sans">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="inventoryRows" value={JSON.stringify(rows)} />
      <input type="hidden" name="partyLedgerId" value={partyId} />
      <input type="hidden" name="salesPurchaseLedgerId" value={accountId} />
      <input
        type="hidden"
        name="taxLedgerId"
        value={enableTax ? taxLedgerId : ""}
      />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />{" "}
          <span className="font-bold">{state.error}</span>
        </div>
      )}

      {/* ✅ HEADER SECTION */}
      {/* Designed to be compact but clean. White background makes inputs pop. */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* 1. Date */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Invoice Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-10/12 h-8 border border-slate-300 px-2 rounded-md text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>

          {/* 2. Party Name */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Party A/c Name
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
              className="w-10/12 h-8 border border-slate-300 px-2 rounded-md text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm bg-white"
            >
              <option value="">Select Party</option>
              {partyLedgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sales/Purchase Ledger */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              {type} Ledger
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-10/12 h-8 border border-slate-300 px-2 rounded-md text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm bg-white"
            >
              <option value="">Select Account</option>
              {accountLedgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tax Toggle & Ledger */}
          <div className="md:col-span-4 flex items-end gap-3">
            {/* Toggle Button */}
            <div
              onClick={() => setEnableTax(!enableTax)}
              className={`h-8 px-3 rounded-md border cursor-pointer flex items-center gap-2 transition-all select-none ${
                enableTax
                  ? "bg-orange-50 border-orange-200 text-orange-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <Settings2 size={14} />
              <span className="text-[10px] font-bold uppercase">
                {enableTax ? "Tax Enabled" : "Tax Disabled"}
              </span>
            </div>

            {/* Tax Dropdown (Shows only if enabled) */}
            {enableTax && (
              <div className="flex-1 animate-in slide-in-from-left-2 duration-200">
                <select
                  value={taxLedgerId}
                  onChange={(e) => setTaxLedgerId(e.target.value)}
                  required
                  className="w-full h-8 border border-orange-300 bg-orange-50/50 px-2 rounded-md text-xs font-bold text-orange-800 outline-none focus:ring-2 focus:ring-orange-100 shadow-sm"
                >
                  <option value="">Select Duty Ledger</option>
                  {taxLedgers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ INVENTORY TABLE SECTION */}
      <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 text-slate-600 p-2 text-[10px] font-bold uppercase tracking-wider">
          <div className="col-span-4 pl-2">Item Description</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right pr-4">Amount</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100 overflow-y-auto bg-white max-h-[400px]">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-12 p-1.5 items-center hover:bg-blue-50 transition-colors group"
            >
              <div className="col-span-4 px-1 relative">
                <select
                  value={row.itemId}
                  onChange={(e) => updateRow(index, "itemId", e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                {enableTax && row.gst > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold pointer-events-none">
                    GST {row.gst}%
                  </span>
                )}
              </div>
              <div className="col-span-2 px-1">
                <input
                  type="number"
                  step="0.01"
                  value={row.qty}
                  onChange={(e) => updateRow(index, "qty", e.target.value)}
                  placeholder="0"
                  className="w-full h-8 text-right px-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm"
                  required
                />
              </div>
              <div className="col-span-2 px-1">
                <input
                  type="number"
                  step="0.01"
                  value={row.rate}
                  onChange={(e) => updateRow(index, "rate", e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 text-right px-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm"
                  required
                />
              </div>
              <div className="col-span-3 px-2 text-right pr-4 font-mono font-bold text-slate-700 text-sm">
                {row.amount.toFixed(2)}
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-2 p-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t border-slate-200 transition-colors"
        >
          <Plus size={14} /> Add Inventory Line
        </button>
      </div>

      {/* ✅ FOOTER SECTION */}
      <div className="mt-4 flex gap-4 items-start">
        {/* Left: Narration */}
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Narration
          </label>
          <textarea
            name="narration"
            rows={2}
            className="w-full border border-slate-300 p-2 rounded-md text-xs font-medium text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none"
            placeholder="Enter invoice details..."
          ></textarea>
        </div>

        {/* Right: Totals Card */}
        <div className="bg-[#003366] text-white p-4 rounded-lg shadow-lg w-72">
          <div className="flex justify-between items-center text-xs font-medium text-blue-100 mb-1">
            <span>Sub Total</span>
            <span className="font-mono">{totalBaseAmount.toFixed(2)}</span>
          </div>

          {enableTax && (
            <div className="flex justify-between items-center text-xs font-bold text-orange-300 mb-2 pb-2 border-b border-white/10">
              <span>Output Tax</span>
              <span className="font-mono">{totalTaxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold uppercase tracking-wide">
              Total
            </span>
            <span className="text-2xl font-mono font-bold text-yellow-400 leading-none">
              {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={isPending || grandTotal === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all hover:scale-[1.02]"
        >
          {isPending ? (
            "Processing..."
          ) : (
            <>
              <Save size={18} /> SAVE INVOICE
            </>
          )}
        </button>
      </div>
    </form>
  );
}
