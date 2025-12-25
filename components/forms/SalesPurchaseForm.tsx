"use client";

import { useState, useActionState, useMemo, useRef, useEffect } from "react";
// Import State type so we can match it
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
  ChevronDown,
  Percent,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface FormState {
  success?: boolean;
  error?: string;
  code?: string;
  txid?: string;
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
    <div className="relative group" ref={searchRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1.5 block">
        {label} {isRequired && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="hidden"
        name={name}
        value={selectedId}
        required={isRequired}
      />
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search
            size={16}
            className="text-slate-400 group-focus-within:text-blue-600 transition-colors"
          />
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
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 shadow-sm"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((l: any) => (
              <div
                key={l.id}
                onClick={() => {
                  setSelectedId(l.id.toString());
                  setSearchTerm(l.name);
                  setIsOpen(false);
                }}
                className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors group/item"
              >
                <span className="text-sm font-bold text-slate-700 group-hover/item:text-blue-700 transition-colors">
                  {l.name}
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase font-black tracking-wide group-hover/item:bg-white group-hover/item:border-blue-100 transition-colors">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-xs text-slate-400 text-center italic font-medium">
              No matching ledgers found.
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
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8 bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-3xl animate-in zoom-in-95 duration-300">
        <div className="bg-white p-6 rounded-full mb-6 shadow-xl shadow-emerald-100">
          <CheckCircle size={48} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {type} Created!
        </h2>

        {/* INFO CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 w-full max-w-sm shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Voucher No
            </span>
            <span className="text-xl font-black text-slate-900">
              #{state.code}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Secure TXID
            </span>
            <span className="text-sm font-mono font-bold text-indigo-600 tracking-tight bg-indigo-50 px-2 py-1 rounded">
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
              className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm text-xs uppercase tracking-widest"
            >
              <Printer size={16} /> Print
            </Link>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} /> Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="w-full h-full flex flex-col font-sans p-1"
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-sm">
          <AlertCircle size={20} />
          <span className="font-bold text-xs uppercase tracking-wide">
            {state.error}
          </span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
        {/* Decorative left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
            Voucher No
          </label>
          <input
            name="voucherNo"
            type="text"
            placeholder="Auto / Manual"
            className="w-full h-11 border-2 border-indigo-100 bg-indigo-50/20 rounded-xl px-4 font-black text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-indigo-300/70 text-sm"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Reference
          </label>
          <input
            name="reference"
            type="text"
            placeholder="Optional"
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300"
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
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnableTax(!enableTax)}
            className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              enableTax
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Percent size={14} />
            {enableTax ? "GST Enabled" : "Enable GST"}
          </button>

          {enableTax && (
            <div className="w-64 relative group">
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
              />
              <select
                value={taxLedgerId}
                onChange={(e) => setTaxLedgerId(e.target.value)}
                className="w-full h-10 border border-emerald-200 rounded-xl px-4 text-xs font-bold text-emerald-800 bg-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer shadow-sm hover:border-emerald-300 transition-all"
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
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md">
            <Paperclip size={14} />
            <span>Attach Proof</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 mb-8">
        <div className="grid grid-cols-12 bg-slate-900 text-white py-4 px-4 text-[10px] uppercase font-black tracking-widest">
          <div className="col-span-5 pl-2">Item Details</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Amount</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/30">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 px-4 py-3 items-center gap-4 hover:bg-white transition-all group"
            >
              <div className="col-span-5">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                  />
                  <select
                    className="w-full h-10 border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white appearance-none cursor-pointer"
                    value={row.itemId}
                    onChange={(e) => updateRow(idx, "itemId", e.target.value)}
                  >
                    <option value="">Select Stock Item...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all placeholder:text-slate-300"
                  value={row.qty}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, "qty", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all placeholder:text-slate-300"
                  value={row.rate}
                  placeholder="0.00"
                  onChange={(e) => updateRow(idx, "rate", e.target.value)}
                />
              </div>
              <div className="col-span-2 text-right pr-4 font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(row.amount)}
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Remove Row"
                >
                  <Trash2 size={16} />
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
          className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-200 flex items-center justify-center gap-2 group"
        >
          <div className="p-1 bg-slate-200 rounded-full group-hover:bg-indigo-200 transition-colors">
            <Plus size={12} />
          </div>
          Add Line Item
        </button>
      </div>

      {/* FOOTER & TOTALS */}
      <div className="mt-auto flex flex-col md:flex-row justify-between items-start gap-8 border-t border-slate-200 pt-8">
        <div className="w-full md:w-1/2 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
            Voucher Narration
          </label>
          <textarea
            name="narration"
            placeholder="Enter transaction details..."
            className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm font-medium resize-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl w-full md:w-[400px] shadow-2xl relative overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all duration-700" />

          <div className="relative z-10 space-y-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="font-mono text-white">
                {formatCurrency(totalBaseAmount)}
              </span>
            </div>

            {enableTax && (
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-4 border-b border-white/10">
                <span>GST / Tax</span>
                <span className="font-mono text-emerald-400">
                  + {formatCurrency(totalTaxAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-end pt-2">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                Grand Total
              </span>
              <span className="text-3xl font-mono font-bold leading-none flex items-baseline">
                <span className="text-lg text-slate-500 mr-1">₹</span>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="mt-8 flex justify-end pb-8">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 active:scale-95 group"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          Save Invoice
        </button>
      </div>
    </form>
  );
}
