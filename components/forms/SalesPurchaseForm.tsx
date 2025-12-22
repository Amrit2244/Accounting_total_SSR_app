"use client";

import { useState, useActionState, useMemo, useRef, useEffect } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Printer,
  Loader2,
  Search,
  Paperclip,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface FormState {
  success?: boolean;
  error?: string;
  code?: string;
  txid?: string; // Added TXID
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

// --- HELPER COMPONENT: SEARCHABLE SELECT ---
const SearchableLedgerSelect = ({
  label,
  name,
  options,
  selectedId,
  setSelectedId,
  isRequired,
  placeholder,
}: any) => {
  const [searchTerm, setSearchTerm] = useState(
    selectedId
      ? options.find((o: any) => o.id.toString() === selectedId)?.name || ""
      : ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 20);
    return options
      .filter((o: any) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 20);
  }, [searchTerm, options]);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="relative" ref={searchRef}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <input
        type="hidden"
        name={name}
        value={selectedId}
        required={isRequired}
      />
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (selectedId) setSelectedId("");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
          autoComplete="off"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((l: any) => (
              <div
                key={l.id}
                onClick={() => {
                  setSelectedId(l.id.toString());
                  setSearchTerm(l.name);
                  setIsOpen(false);
                }}
                className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-bold text-slate-800">
                  {l.name}
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-bold tracking-wide">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-400 text-center italic">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- ACTION WRAPPER ---
async function createVoucherWrapper(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  return await createVoucher(prevState, formData);
}

// --- MAIN COMPONENT ---
export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucherWrapper, {});
  const formRef = useRef<HTMLFormElement>(null);

  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [enableTax, setEnableTax] = useState(true);
  const [taxLedgerId, setTaxLedgerId] = useState("");
  const [rows, setRows] = useState<VoucherRow[]>([
    { itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 },
  ]);

  const partyLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) =>
        ["debtor", "creditor", "cash", "bank", "party"].some((k) =>
          l.group.name.toLowerCase().includes(k)
        )
      ),
    [ledgers]
  );

  const accountLedgersImpl = useMemo(
    () =>
      ledgers.filter(
        (l) =>
          l.group.name.toLowerCase().includes(type.toLowerCase()) ||
          l.group.name.toLowerCase().includes("sales") ||
          l.group.name.toLowerCase().includes("purchase")
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

    const q = parseFloat(newRows[index].qty.toString()) || 0;
    const r = parseFloat(newRows[index].rate.toString()) || 0;
    const g = newRows[index].gst || 0;

    const rowBaseAmount = q * r;
    newRows[index].amount = rowBaseAmount;
    newRows[index].taxAmount = rowBaseAmount * (g / 100);

    setRows(newRows);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  // --- SUCCESS VIEW WITH TXID ---
  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl shadow-sm animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {type} Created!
        </h2>

        {/* INFO CARD */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-8 w-full max-w-xs shadow-sm">
          <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">
              Voucher No
            </span>
            <span className="text-lg font-black text-slate-900">
              #{state.code}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase">
              Secure TXID
            </span>
            <span className="text-lg font-mono font-black text-blue-600 tracking-tight">
              {state.txid || "---"}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          {state.id && (
            <Link
              href={`/companies/${companyId}/vouchers/${type.toLowerCase()}/${
                state.id
              }/print`}
              target="_blank"
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer size={18} /> Print
            </Link>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
          >
            Create Another
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

      {/* HIDDEN INPUTS */}
      <input
        type="hidden"
        name="inventoryRows"
        value={JSON.stringify(rows.filter((r) => r.itemId && r.itemId !== ""))}
      />
      <input
        type="hidden"
        name="taxLedgerId"
        value={enableTax ? taxLedgerId : ""}
      />
      <input type="hidden" name="totalAmount" value={grandTotal} />
      <input type="hidden" name="totalVal" value={totalBaseAmount} />
      <input type="hidden" name="taxVal" value={totalTaxAmount} />

      {state?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="font-bold text-xs uppercase tracking-wide">
            {state.error}
          </span>
        </div>
      )}

      {/* FORM INPUTS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 block">
            Voucher No
          </label>
          <input
            name="voucherNo"
            type="text"
            placeholder="Auto / Manual"
            className="w-full h-10 border-2 border-blue-100 bg-blue-50/20 rounded-lg px-3 font-bold text-slate-800 focus:border-blue-500 outline-none placeholder:text-slate-400/70"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
            Reference / Bill No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="Optional"
            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label="Party A/c Name"
            name="partyLedgerId"
            options={partyLedgersImpl}
            selectedId={partyId}
            setSelectedId={setPartyId}
            isRequired={true}
            placeholder="Select Party..."
          />
        </div>

        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label={`${type} Ledger`}
            name="salesPurchaseLedgerId"
            options={accountLedgersImpl}
            selectedId={accountId}
            setSelectedId={setAccountId}
            isRequired={true}
            placeholder={`Select ${type} Account...`}
          />
        </div>
      </div>

      {/* TAX & ATTACHMENT */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnableTax(!enableTax)}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              enableTax
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {enableTax ? "GST Enabled" : "Enable GST"}
          </button>

          {enableTax && (
            <div className="w-64">
              <select
                value={taxLedgerId}
                onChange={(e) => setTaxLedgerId(e.target.value)}
                className="w-full h-9 border border-emerald-300 rounded-lg px-3 text-xs font-bold text-emerald-800 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- Select Tax Ledger --</option>
                {taxLedgersImpl.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="relative group">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase cursor-pointer hover:text-blue-600 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300">
            <Paperclip size={14} />
            <span>Attach Proof</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="flex-1 bg-white border border-slate-300 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-12 bg-slate-900 text-white py-3 px-2 text-[10px] uppercase font-black tracking-wider">
          <div className="col-span-5 pl-2">Item Details</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Amount</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 p-2 items-center gap-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="col-span-5">
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none bg-transparent"
                  value={row.itemId}
                  onChange={(e) => updateRow(idx, "itemId", e.target.value)}
                >
                  <option value="">Select Stock Item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-right text-xs font-mono font-medium focus:border-blue-500 outline-none"
                  value={row.qty}
                  onChange={(e) => updateRow(idx, "qty", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-right text-xs font-mono font-medium focus:border-blue-500 outline-none"
                  value={row.rate}
                  onChange={(e) => updateRow(idx, "rate", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2 text-right pr-4 font-mono font-bold text-slate-800 text-sm">
                {formatCurrency(row.amount)}
              </div>

              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
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
          className="w-full py-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 hover:bg-blue-100 transition-colors border-t border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Line Item
        </button>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-6">
        <textarea
          name="narration"
          placeholder="Enter narration here..."
          className="w-full md:w-1/2 h-24 border border-slate-300 rounded-xl p-4 text-xs font-medium text-slate-700 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
        />

        <div className="bg-slate-900 text-white p-6 rounded-2xl w-full md:w-96 shadow-xl">
          <div className="flex justify-between text-[11px] mb-2 font-bold text-slate-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="font-mono text-white text-sm">
              {formatCurrency(totalBaseAmount)}
            </span>
          </div>

          {enableTax && (
            <div className="flex justify-between text-[11px] mb-4 border-b border-white/10 pb-4 font-bold text-slate-400 uppercase tracking-widest">
              <span>GST / Tax</span>
              <span className="font-mono text-emerald-400 text-sm">
                + {formatCurrency(totalTaxAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-end">
            <span className="text-xs font-black uppercase text-blue-400 tracking-widest mb-1">
              Grand Total
            </span>
            <span className="text-3xl font-mono font-bold leading-none">
              <span className="text-lg mr-1 text-slate-500">₹</span>
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end pb-8">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className="bg-[#003366] hover:bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          Save Invoice
        </button>
      </div>
    </form>
  );
}
