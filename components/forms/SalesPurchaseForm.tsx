"use client";

import {
  useState,
  useActionState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Printer,
  Settings2,
  Loader2,
  IndianRupee,
  Search,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface FormState {
  success?: boolean;
  error?: string;
  code?: string;
  id?: number;
}

type Ledger = {
  id: number;
  name: string;
  group: { name: string };
};

type Item = {
  id: number;
  name: string;
  gstRate: number;
};

type VoucherRow = {
  itemId: string;
  qty: string;
  rate: string;
  gst: number;
  amount: number;
  taxAmount: number;
};

type Props = {
  companyId: number;
  type: string;
  ledgers: Ledger[];
  items: Item[];
};

// --- UTILITIES ---
const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ✅ FIX: Wrapper Function
async function createVoucherWrapper(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await createVoucher(prevState, formData);
  return result as FormState;
}

const initialState: FormState = {};

export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: Props) {
  const [state, action, isPending] = useActionState(
    createVoucherWrapper,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [enableTax, setEnableTax] = useState(true);
  const [taxLedgerId, setTaxLedgerId] = useState("");
  const [showTaxOptions, setShowTaxOptions] = useState(false);
  const [rows, setRows] = useState<VoucherRow[]>([
    { itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 },
  ]);

  // Filters
  const partyLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) =>
        ["debtor", "creditor", "cash", "bank"].some((k) =>
          l.group.name.toLowerCase().includes(k)
        )
      ),
    [ledgers]
  );
  const accountLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) =>
        l.group.name.toLowerCase().includes(type.toLowerCase())
      ),
    [ledgers, type]
  );
  const taxLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) =>
        ["tax", "gst", "duties"].some((k) =>
          l.group.name.toLowerCase().includes(k)
        )
      ),
    [ledgers]
  );

  const updateRow = (
    index: number,
    field: keyof VoucherRow,
    value: string | number
  ) => {
    const newRows = [...rows];
    (newRows[index] as any)[field] = value;
    if (field === "itemId") {
      const item = items.find((i) => i.id.toString() === value);
      newRows[index].gst = item?.gstRate || 0;
    }
    const q = parseFloat(newRows[index].qty) || 0;
    const r = parseFloat(newRows[index].rate) || 0;
    newRows[index].amount = q * r;
    newRows[index].taxAmount = q * r * (newRows[index].gst / 100);
    setRows(newRows);
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-green-50 border-2 border-dashed border-green-200 rounded-2xl shadow-md">
        <CheckCircle size={48} className="text-green-600 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {type} Invoice Created
        </h2>
        <p className="text-slate-500 mb-8 font-mono font-bold">{state.code}</p>
        <div className="flex gap-4">
          <Link
            href={`/companies/${companyId}/vouchers/${state.id}/print`}
            target="_blank"
            className="bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Printer size={18} /> Print
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Create New
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="w-full h-full flex flex-col font-sans"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="inventoryRows" value={JSON.stringify(rows)} />
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

      {/* Basic Inputs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md mb-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-10 border rounded px-2"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Ref No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="INV-001"
            className="w-full h-10 border rounded px-2"
          />
        </div>
        <div className="md:col-span-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Party
          </label>
          <select
            onChange={(e) => setPartyId(e.target.value)}
            name="partyLedgerId"
            className="w-full h-10 border rounded px-2"
            required
          >
            <option value="">Select Party</option>
            {partyLedgersImpl.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            A/c Ledger
          </label>
          <select
            onChange={(e) => setAccountId(e.target.value)}
            name="salesPurchaseLedgerId"
            className="w-full h-10 border rounded px-2"
            required
          >
            <option value="">Select Account</option>
            {accountLedgersImpl.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tax Section */}
      <div className="mb-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEnableTax(!enableTax)}
          className={`px-4 py-2 rounded border text-[10px] font-bold uppercase ${
            enableTax
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-slate-50"
          }`}
        >
          {enableTax ? "Tax Enabled" : "Enable Tax"}
        </button>
        {enableTax && (
          <select
            onChange={(e) => setTaxLedgerId(e.target.value)}
            className="h-10 border rounded px-2 text-xs"
          >
            <option value="">Select Tax Ledger</option>
            {taxLedgersImpl.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-md">
        <div className="grid grid-cols-12 bg-slate-800 text-white p-2 text-[10px] uppercase font-bold">
          <div className="col-span-5 pl-2">Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right pr-4">Total</div>
        </div>
        <div className="divide-y max-h-[300px] overflow-y-auto">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 p-2 items-center gap-2">
              <select
                className="col-span-5 h-8 border rounded text-xs"
                value={row.itemId}
                onChange={(e) => updateRow(idx, "itemId", e.target.value)}
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="col-span-2 h-8 border rounded text-right px-2"
                value={row.qty}
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
              />
              <input
                type="number"
                className="col-span-2 h-8 border rounded text-right px-2"
                value={row.rate}
                onChange={(e) => updateRow(idx, "rate", e.target.value)}
              />
              <div className="col-span-3 text-right pr-4 font-mono font-bold">
                {formatCurrency(row.amount)}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              {
                itemId: "",
                qty: "",
                rate: "",
                gst: 0,
                amount: 0,
                taxAmount: 0,
              },
            ])
          }
          className="p-2 text-xs font-bold bg-slate-50 border-t"
        >
          {" "}
          + Add Row
        </button>
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-between items-end">
        <textarea
          name="narration"
          placeholder="Narration..."
          className="border rounded p-2 text-xs w-1/2 h-16"
        />
        <div className="bg-slate-800 text-white p-4 rounded-lg w-72">
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(totalBaseAmount)}</span>
          </div>
          <div className="flex justify-between text-xs mb-2 border-b border-white/10 pb-2">
            <span>Tax:</span>
            <span>{formatCurrency(totalTaxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-yellow-400">
            <span>TOTAL:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Save />} SAVE
          INVOICE (F4)
        </button>
      </div>
    </form>
  );
}
