"use client";

import { useState, useActionState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Search,
  Loader2,
  Paperclip,
  ChevronDown,
  ShieldCheck,
  Database,
  User,
  ShoppingBag,
  ExternalLink,
  PlusCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { format, isValid } from "date-fns";

// --- TYPES (Restored Original Interface) ---
interface VoucherActionState {
  success: boolean;
  message?: string;
  code?: string;
  txid?: string;
  id?: number;
  error?: string;
}

const initialState: VoucherActionState = {
  success: false,
  message: undefined,
  code: undefined,
  txid: undefined,
  id: undefined,
  error: undefined,
};

const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// --- SMART DATE PARSER (Tally Logic) ---
const parseTallyDate = (input: string): Date | null => {
  if (!input) return null;
  const today = new Date();
  const clean = input.trim().replace(/[./\s]/g, "-");
  const parts = clean.split("-");

  let d = today.getDate();
  let m = today.getMonth();
  let y = today.getFullYear();

  if (parts.length === 1) {
    d = parseInt(parts[0]);
  } else if (parts.length === 2) {
    d = parseInt(parts[0]);
    m = parseInt(parts[1]) - 1;
  } else if (parts.length === 3) {
    d = parseInt(parts[0]);
    m = parseInt(parts[1]) - 1;
    let yPart = parseInt(parts[2]);
    y = yPart < 100 ? 2000 + yPart : yPart;
  }

  const result = new Date(y, m, d);
  return isValid(result) ? result : null;
};

// --- REUSABLE DROPDOWN WITH CREATE LINK ---
const SearchableLedgerSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select Account",
  companyId,
  icon: Icon,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find((o: any) => o.id.toString() === value);

  const filteredOptions = useMemo(() => {
    if (!query) return options.slice(0, 50);
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, "");
    return options
      .filter((o: any) =>
        o.name.toLowerCase().replace(/\s+/g, "").includes(normalizedQuery),
      )
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center h-10 px-3 border rounded-lg cursor-pointer bg-white transition-all shadow-sm ${
          isOpen
            ? "ring-2 ring-indigo-500 border-transparent"
            : "border-slate-200 hover:border-indigo-300"
        }`}
      >
        {Icon && <Icon size={14} className="text-slate-400 mr-2" />}

        {isOpen ? (
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-800 uppercase placeholder:normal-case"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : (
          <div
            className={`flex-1 text-xs font-bold uppercase truncate ${
              selectedItem ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {selectedItem ? selectedItem.name : placeholder}
          </div>
        )}
        <ChevronDown size={14} className="text-slate-400 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: any) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id.toString());
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                >
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    {opt.name}
                  </span>
                  <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {opt.group?.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-[10px] italic flex items-center justify-center gap-2">
                <Database size={14} /> No matches
              </div>
            )}
          </div>

          {/* ✅ CREATE NEW LEDGER LINK */}
          <Link
            href={`/companies/${companyId}/ledgers/create`}
            target="_blank"
            className="p-3 bg-slate-50 border-t border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            <PlusCircle size={14} /> Create New Ledger
            <ExternalLink size={10} className="opacity-50" />
          </Link>
        </div>
      )}
    </div>
  );
};

// --- MAIN SALES/PURCHASE FORM ---
export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers = [],
  items = [],
  isAdmin,
}: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createVoucher as any,
    initialState,
  );

  // Form State
  const [partyLedgerId, setPartyLedgerId] = useState("");
  const [salesLedgerId, setSalesLedgerId] = useState("");
  const [rows, setRows] = useState([
    { itemId: "", quantity: "", rate: "", amount: 0 },
  ]);

  // --- TALLY DATE STATE ---
  const [dateDisplay, setDateDisplay] = useState(
    format(new Date(), "dd-MM-yyyy"),
  );
  const [dateValue, setDateValue] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parsed = parseTallyDate(e.target.value);
    if (parsed) {
      setDateDisplay(format(parsed, "dd-MM-yyyy"));
      setDateValue(format(parsed, "yyyy-MM-dd"));
    } else {
      setDateDisplay(format(new Date(dateValue), "dd-MM-yyyy"));
    }
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  // Calculate Totals
  const totalAmount = rows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );

  // Filter Ledgers
  const partyLedgers = ledgers;
  const accountLedgers = ledgers.filter(
    (l: any) =>
      l.group?.name
        .toUpperCase()
        .includes(type === "SALES" ? "SALES" : "PURCHASE") ||
      l.group?.name.toUpperCase().includes("ACCOUNT"),
  );

  // Row Helpers
  const updateRow = (idx: number, field: string, value: any) => {
    const newRows: any = [...rows];
    newRows[idx][field] = value;

    if (field === "quantity" || field === "rate") {
      const q = parseFloat(newRows[idx].quantity) || 0;
      const r = parseFloat(newRows[idx].rate) || 0;
      newRows[idx].amount = q * r;
    }
    setRows(newRows);
  };

  useEffect(() => {
    if (state?.success) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: isAdmin ? ["#6366f1", "#4f46e5"] : ["#10B981", "#3B82F6"],
      });
    }
  }, [state?.success, isAdmin]);

  // --- RESTORED SUCCESS VIEW (With TXID) ---
  if (state?.success) {
    const isAutoVerified = state.message === "Authorized";
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-3xl animate-in zoom-in-95">
        <div
          className={`p-6 rounded-full mb-6 ${
            isAutoVerified
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isAutoVerified ? (
            <ShieldCheck size={48} />
          ) : (
            <CheckCircle size={48} />
          )}
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">
          Voucher Created
        </h2>

        {/* ✅ THIS IS THE BOX WITH THE TXID YOU WANTED BACK */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full max-w-sm mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Voucher #
            </span>
            <span className="font-black text-slate-900">
              {state.id || state.code}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">
              TXID
            </span>
            <span className="font-mono font-bold text-indigo-600">
              {state.txid || "---"}
            </span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-600 transition-colors"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col h-full space-y-6 font-sans p-1"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="totalAmount" value={totalAmount} />
      {/* ✅ ISO DATE HIDDEN INPUT */}
      <input type="hidden" name="date" value={dateValue} />

      <input type="hidden" name="partyLedgerId" value={partyLedgerId} />
      <input type="hidden" name="salesPurchaseLedgerId" value={salesLedgerId} />
      <input
        type="hidden"
        name="inventoryEntries"
        value={JSON.stringify(rows)}
      />

      {state?.error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} /> {state.error}
        </div>
      )}

      {/* TOP SECTION: META DATA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* ✅ TALLY DATE INPUT */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Posting Date (DD-MM)
          </label>
          <div className="relative">
            <CalendarIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={dateDisplay}
              onChange={(e) => setDateDisplay(e.target.value)}
              onBlur={handleDateBlur}
              onKeyDown={handleDateKeyDown}
              className="w-full h-10 pl-9 pr-3 border border-slate-200 bg-slate-50 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. 5 or 5-4"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Invoice / Ref No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="e.g. INV-001"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-bold outline-none"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Party A/c Name (Dr/Cr)
          </label>
          {/* ✅ WITH LINK */}
          <SearchableLedgerSelect
            value={partyLedgerId}
            onChange={setPartyLedgerId}
            options={partyLedgers}
            companyId={companyId}
            placeholder="Select Party Ledger..."
            icon={User}
          />
        </div>
      </div>

      {/* MIDDLE SECTION: ACCOUNT DETAILS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            {type === "SALES" ? "Sales" : "Purchase"} Account
          </label>
          {/* ✅ WITH LINK */}
          <SearchableLedgerSelect
            value={salesLedgerId}
            onChange={setSalesLedgerId}
            options={accountLedgers}
            companyId={companyId}
            placeholder={`Select ${type.toLowerCase()} ledger...`}
            icon={ShoppingBag}
          />
        </div>
      </div>

      {/* ITEM GRID */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
        <div className="grid grid-cols-12 bg-slate-900 text-white p-3 text-[10px] font-black uppercase tracking-widest">
          <div className="col-span-5">Item Name</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Amount</div>
          <div className="col-span-1"></div>
        </div>
        <div className="flex-1 p-2 space-y-1 bg-slate-50 min-h-[200px]">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1 bg-white border border-slate-100 rounded-lg shadow-sm"
            >
              <div className="col-span-5">
                <select
                  value={row.itemId}
                  onChange={(e) => updateRow(idx, "itemId", e.target.value)}
                  className="w-full h-9 bg-transparent text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">Select Item...</option>
                  {items.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                placeholder="0"
                className="col-span-2 h-9 text-right text-xs font-mono font-bold outline-none bg-slate-50 px-2 rounded"
                value={row.quantity}
                onChange={(e) => updateRow(idx, "quantity", e.target.value)}
              />
              <input
                type="number"
                placeholder="0.00"
                className="col-span-2 h-9 text-right text-xs font-mono font-bold outline-none bg-slate-50 px-2 rounded"
                value={row.rate}
                onChange={(e) => updateRow(idx, "rate", e.target.value)}
              />
              <div className="col-span-2 text-right font-mono font-bold text-slate-700 pr-2">
                {Number(row.amount).toFixed(2)}
              </div>
              <div className="col-span-1 flex justify-center">
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              { itemId: "", quantity: "", rate: "", amount: 0 },
            ])
          }
          className="w-full py-3 bg-white text-[10px] font-black text-slate-500 border-t border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={12} /> Add Item Line
        </button>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <textarea
          name="narration"
          rows={3}
          placeholder="Narration..."
          className="w-full md:flex-1 p-4 border border-slate-200 rounded-2xl text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <div
          className={`w-full md:w-72 p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between h-36 relative overflow-hidden ${
            isAdmin ? "bg-indigo-900" : "bg-slate-900"
          }`}
        >
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase opacity-60">
              Total Amount
            </div>
            <div className="text-3xl font-mono font-bold tracking-tight mt-1">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>
          <button
            disabled={isPending || !partyLedgerId || totalAmount <= 0}
            className="relative z-10 w-full py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            {isAdmin ? "Authorize" : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}
