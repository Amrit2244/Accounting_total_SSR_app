"use client";

import { useState, useActionState, useMemo, useRef, useEffect } from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Save,
  CheckCircle,
  Loader2,
  Search,
  Trash2,
  ChevronDown,
  Percent,
  ShieldCheck,
  Clock,
  Database,
  XCircle,
  Filter,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

// --- TYPES ---
interface FormState {
  success: boolean;
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

const initialState: FormState = {
  success: false,
};

const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// --- HELPER: SEARCHABLE SELECT ---
const SearchableLedgerSelect = ({
  label,
  name,
  options = [],
  selectedId,
  setSelectedId,
  isRequired,
  placeholder,
  filterActive,
}: any) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    if (!options) return "";
    const found = options.find((o: any) => o.id.toString() === selectedId);
    return found ? found.name : "";
  }, [selectedId, options]);

  const filtered = useMemo(() => {
    if (!options) return [];
    if (!query) return options.slice(0, 100);

    const lowercaseQuery = query.toLowerCase();
    return options
      .filter(
        (o: any) =>
          (o.name || "").toLowerCase().includes(lowercaseQuery) ||
          (o.group?.name || "").toLowerCase().includes(lowercaseQuery)
      )
      .slice(0, 100);
  }, [query, options]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className="relative group"
      ref={containerRef}
      style={{ zIndex: isOpen ? 1000 : 10 }}
    >
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1.5 flex justify-between items-center">
        <span>
          {label} {isRequired && <span className="text-rose-500">*</span>}
        </span>
        <div className="flex gap-2">
          {filterActive && options.length > 0 && (
            <span className="text-indigo-500 flex items-center gap-1 text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              <Filter size={8} /> Smart Filter
            </span>
          )}
          {(!options || options.length === 0) && (
            <span className="text-rose-500 flex items-center gap-1 animate-pulse text-[9px] font-bold">
              <Database size={10} /> NO DATA
            </span>
          )}
        </div>
      </label>

      <input
        type="hidden"
        name={name}
        value={selectedId}
        required={isRequired}
      />

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center w-full h-11 px-3.5 bg-white border rounded-xl transition-all cursor-pointer shadow-sm ${
          isOpen
            ? "ring-2 ring-indigo-600 border-transparent"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Search
          size={16}
          className={`mr-2 ${isOpen ? "text-indigo-600" : "text-slate-400"}`}
        />

        {isOpen ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 uppercase"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className={`flex-1 text-sm font-semibold truncate uppercase ${
              displayName ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {displayName || placeholder}
          </div>
        )}

        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => {
                    setSelectedId(l.id.toString());
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="px-4 py-3 flex items-center justify-between hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-slate-800 uppercase">
                      {l.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                      {l.group?.name || "General"}
                    </span>
                  </div>
                  {selectedId === l.id.toString() && (
                    <CheckCircle size={16} className="text-indigo-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <XCircle size={24} className="text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  No matches found
                </p>
                <button
                  type="button"
                  className="text-[10px] text-indigo-600 font-bold mt-2 hover:underline"
                >
                  Create New Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers = [],
  items = [],
  isAdmin,
}: Props) {
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

  // ✅ 1. PARTY LEDGER FILTER (Kept as is - Works Fine)
  const partyLedgerOptions = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];

    // Keywords for Party Accounts (Debtors, Creditors, Bank, Cash)
    const validGroups = [
      "debtor",
      "creditor",
      "cash",
      "bank",
      "party",
      "customer",
      "supplier",
      "receivable",
      "payable",
    ];

    const filtered = ledgers.filter((l) => {
      const g = l.group?.name?.toLowerCase() || "";
      return validGroups.some((k) => g.includes(k));
    });

    return filtered.length > 0 ? filtered : ledgers;
  }, [ledgers]);

  // ✅ 2. SALES/PURCHASE FILTER (STRICT MODE UPDATED)
  const accountLedgerOptions = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];

    const filtered = ledgers.filter((l) => {
      const g = l.group?.name?.toLowerCase() || "";

      // STRICT FILTER: Only groups containing 'sales' for SALES voucher
      if (type === "SALES") {
        return g.includes("sales");
      }
      // STRICT FILTER: Only groups containing 'purchase' for PURCHASE voucher
      else if (type === "PURCHASE") {
        return g.includes("purchase");
      }
      return true;
    });

    // Fallback only if the strict filter is completely empty (prevent blocking)
    return filtered.length > 0 ? filtered : ledgers;
  }, [ledgers, type]);

  const taxLedgerOptions = useMemo(() => {
    if (!ledgers) return [];
    return ledgers.filter((l) => {
      const g = l.group?.name?.toLowerCase() || "";
      return g.includes("tax") || g.includes("gst") || g.includes("duties");
    });
  }, [ledgers]);

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
          : ["#10B981", "#3B82F6", "#F59E0B"],
      });
    }
  }, [state?.success, isAdmin]);

  if (state?.success) {
    const isAutoVerified =
      state.message?.toLowerCase().includes("approved") ||
      state.message?.toLowerCase().includes("authorized");
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl relative overflow-hidden">
        <div
          className={`absolute top-0 inset-x-0 h-2 ${
            isAutoVerified ? "bg-indigo-600" : "bg-emerald-600"
          }`}
        />
        <div
          className={`${
            isAutoVerified
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600"
          } p-6 rounded-full mb-6 border border-slate-100 shadow-sm`}
        >
          {isAutoVerified ? (
            <ShieldCheck size={48} />
          ) : (
            <CheckCircle size={48} />
          )}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {isAutoVerified ? "Authorized" : "Voucher Created"}
        </h2>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full max-w-xs shadow-inner mb-8 text-left">
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
            <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded border border-slate-200">
              {state.txid || "---"}
            </span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-12 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
        >
          Create New
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="w-full h-full flex flex-col font-sans p-1">
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

      {/* DEBUG STRIP */}
      <div className="flex justify-end mb-2">
        <span
          className={`text-[9px] font-bold px-2 py-1 rounded border ${
            ledgers.length > 0
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}
        >
          DB Status: {ledgers.length} Ledgers Loaded
        </span>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-visible">
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
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
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

        {/* PARTY ACCOUNT */}
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label="Party Account"
            name="partyLedgerId"
            options={partyLedgerOptions}
            selectedId={partyId}
            setSelectedId={setPartyId}
            isRequired
            placeholder="Select Party..."
            filterActive={partyLedgerOptions.length < ledgers.length}
          />
        </div>

        {/* ACCOUNT LEDGER */}
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label={`${type} Ledger`}
            name="salesPurchaseLedgerId"
            options={accountLedgerOptions}
            selectedId={accountId}
            setSelectedId={setAccountId}
            isRequired
            placeholder="Select Ledger..."
            filterActive={accountLedgerOptions.length < ledgers.length}
          />
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
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-xs font-bold bg-white outline-none cursor-pointer"
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
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold outline-none"
                value={row.qty}
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
                placeholder="0"
              />
              <input
                type="number"
                step="any"
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold outline-none"
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
          className="w-full py-3 text-[10px] font-black uppercase text-slate-500 bg-slate-50 hover:bg-indigo-50 transition-colors border-t border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={12} /> Add Line Item
        </button>
      </div>

      <div className="mt-auto flex flex-col md:flex-row justify-between items-start gap-8 border-t border-slate-200 pt-8 pb-12">
        <div className="w-full md:w-1/2 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
            Narration
          </label>
          <textarea
            name="narration"
            placeholder="Enter notes..."
            className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 focus:bg-white transition-all"
          />
        </div>
        <div
          className={`p-8 rounded-3xl w-full md:w-[400px] shadow-2xl relative overflow-hidden text-white ${
            isAdmin ? "bg-indigo-900" : "bg-slate-900"
          }`}
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
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

      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className={`px-12 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
            isAdmin
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-slate-900 hover:bg-slate-800"
          } text-white disabled:opacity-50`}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isAdmin ? (
            <ShieldCheck size={20} />
          ) : (
            <Save size={20} />
          )}
          {isAdmin ? "Authorize & Post" : "Save Voucher"}
        </button>
      </div>
    </form>
  );
}
