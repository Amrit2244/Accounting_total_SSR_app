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
  ChevronDown,
  Percent,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

// --- TYPES ---
interface FormState {
  success: boolean; // FIXED: Mandatory boolean to match server action return
  error?: string;
  code?: string;
  txid?: string;
  id?: number;
  message?: string;
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
  isAdmin?: boolean;
};

// FIXED: Initial state now strictly follows FormState
const initialState: FormState = {
  success: false,
  error: undefined,
  code: undefined,
  txid: undefined,
  id: undefined,
  message: undefined,
};

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
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 shadow-sm"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
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
                <span className="text-sm font-bold text-slate-700">
                  {l.name}
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase font-black">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-xs text-slate-400 text-center italic">
              No matching ledgers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
  isAdmin,
}: Props) {
  // ✅ FIXED: Passed structured initialState and used 'as any' cast for hook compatibility
  const [state, action, isPending] = useActionState(
    createVoucher as any,
    initialState
  );

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
    newRows[index].amount = q * r;
    newRows[index].taxAmount = q * r * (g / 100);
    setRows(newRows);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  useEffect(() => {
    if (state?.success) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: isAdmin
          ? ["#6366f1", "#4f46e5", "#ffffff"]
          : ["#10B981", "#3B82F6", "#FBBF24"],
      });
    }
  }, [state?.success, isAdmin]);

  if (state?.success) {
    const isAutoVerified =
      state.message?.toLowerCase().includes("approved") ||
      state.message?.toLowerCase().includes("authorized");
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div
          className={`absolute top-0 inset-x-0 h-2 ${
            isAutoVerified ? "bg-indigo-600" : "bg-emerald-600"
          }`}
        />
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div
            className={`${
              isAutoVerified
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            } p-6 rounded-full mb-6 shadow-sm border`}
          >
            {isAutoVerified ? (
              <ShieldCheck size={48} strokeWidth={1.5} />
            ) : (
              <CheckCircle size={48} strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            {isAutoVerified ? "Voucher Authorized" : `${type} Created!`}
          </h2>
          <div
            className={`border px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8 ${
              isAutoVerified
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isAutoVerified ? (
              <ShieldCheck size={12} />
            ) : (
              <Clock size={12} className="animate-pulse" />
            )}
            Status:{" "}
            {isAutoVerified ? "Approved & Posted" : "Pending Verification"}
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full shadow-inner mb-8 text-left">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Voucher No
              </span>
              <span className="text-xl font-black text-slate-900">
                #{state.code || state.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Secure TXID
              </span>
              <span className="text-sm font-mono font-bold text-indigo-600 tracking-tight bg-white px-2 py-1 rounded border border-slate-200">
                {state.txid || "---"}
              </span>
            </div>
          </div>
          <div className="flex gap-4 w-full">
            {state.id && (
              <Link
                href={`/companies/${companyId}/vouchers/${type.toLowerCase()}/${
                  state.id
                }/print`}
                target="_blank"
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-xs uppercase shadow-sm"
              >
                <Printer size={16} /> Print
              </Link>
            )}
            <button
              onClick={() => window.location.reload()}
              className={`flex-1 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isAutoVerified
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-900 hover:bg-indigo-600"
              }`}
            >
              Create New
            </button>
          </div>
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
      <input
        type="hidden"
        name="inventoryRows"
        value={JSON.stringify(rows.filter((r) => r.itemId))}
      />
      <input
        type="hidden"
        name="taxLedgerId"
        value={enableTax ? taxLedgerId : ""}
      />
      <input type="hidden" name="totalAmount" value={grandTotal.toString()} />
      <input type="hidden" name="totalVal" value={totalBaseAmount.toString()} />
      <input type="hidden" name="taxVal" value={totalTaxAmount.toString()} />

      {state?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} />
          <span className="font-bold text-xs uppercase tracking-wide">
            {state.error}
          </span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isAdmin ? "bg-indigo-600" : "bg-blue-600"
          }`}
        />
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            required
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label
            className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
              isAdmin ? "text-indigo-600" : "text-blue-600"
            }`}
          >
            Voucher No
          </label>
          <input
            name="voucherNo"
            type="text"
            placeholder="No."
            className="w-full h-11 border-2 border-indigo-50 bg-white rounded-xl px-4 font-black text-slate-800 outline-none focus:border-indigo-500 text-sm"
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
            placeholder="Ref No."
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label="Party Account"
            name="partyLedgerId"
            options={partyLedgersImpl}
            selectedId={partyId}
            setSelectedId={setPartyId}
            isRequired
            placeholder="Customer/Supplier..."
          />
        </div>
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label={`${type} Ledger`}
            name="salesPurchaseLedgerId"
            options={accountLedgersImpl}
            selectedId={accountId}
            setSelectedId={setAccountId}
            isRequired
            placeholder={`${type} A/c...`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnableTax(!enableTax)}
            className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              enableTax
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "bg-white text-slate-400 border-slate-200"
            }`}
          >
            <Percent size={14} /> {enableTax ? "Tax Applied" : "Add Tax"}
          </button>
          {enableTax && (
            <div className="w-64 relative">
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
              />
              <select
                value={taxLedgerId}
                onChange={(e) => setTaxLedgerId(e.target.value)}
                className="w-full h-10 border border-emerald-200 rounded-xl px-4 text-xs font-bold text-emerald-800 bg-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none shadow-sm"
              >
                <option value="">-- Tax Ledger --</option>
                {taxLedgersImpl.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="relative">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors hover:text-indigo-600">
            <Paperclip size={14} /> <span>Attachment</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
        <div className="grid grid-cols-12 bg-slate-900 text-white py-4 px-4 text-[10px] uppercase font-black tracking-widest">
          <div className="col-span-5 pl-2">Item Description</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Total</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto bg-slate-50/30">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 px-4 py-3 items-center gap-4 hover:bg-white group transition-colors"
            >
              <div className="col-span-5">
                <select
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  value={row.itemId}
                  onChange={(e) => updateRow(idx, "itemId", e.target.value)}
                >
                  <option value="">Select Item...</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                step="any"
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold bg-white outline-none"
                value={row.qty}
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
                placeholder="0"
              />
              <input
                type="number"
                step="any"
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold bg-white outline-none"
                value={row.rate}
                onChange={(e) => updateRow(idx, "rate", e.target.value)}
                placeholder="0.00"
              />
              <div className="col-span-2 text-right pr-4 font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(row.amount)}
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="col-span-1 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
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
          className="w-full py-3 text-[10px] font-black uppercase text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={12} /> Add Line Item
        </button>
      </div>

      <div className="mt-auto flex flex-col md:flex-row justify-between items-start gap-8 border-t border-slate-200 pt-8">
        <div className="w-full md:w-1/2 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
            Narration
          </label>
          <textarea
            name="narration"
            placeholder="Notes..."
            className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm font-medium bg-slate-50 focus:bg-white outline-none transition-all resize-none shadow-inner"
          />
        </div>
        <div
          className={`p-8 rounded-3xl w-full md:w-[400px] shadow-2xl relative overflow-hidden text-white ${
            isAdmin ? "bg-indigo-900" : "bg-slate-900"
          }`}
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Taxable Value</span>
              <span className="font-mono text-white">
                {formatCurrency(totalBaseAmount)}
              </span>
            </div>
            {enableTax && (
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-4 border-b border-white/10">
                <span>GST Amount</span>
                <span className="font-mono text-emerald-400">
                  + {formatCurrency(totalTaxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2">
              <span
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                  isAdmin ? "text-indigo-400" : "text-blue-400"
                }`}
              >
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

      <div className="mt-8 flex justify-end pb-8">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className={`px-12 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center gap-3 active:scale-95 group
            ${
              isAdmin
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/40"
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/40"
            }
            disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
          `}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isAdmin ? (
            <ShieldCheck size={20} />
          ) : (
            <Save size={20} />
          )}
          {isAdmin ? "Authorize & Post Instantly" : "Save for Approval"}
        </button>
      </div>
    </form>
  );
}
