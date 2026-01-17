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
  Clock,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  Database,
  PlusCircle,
  ExternalLink,
  Calendar as CalendarIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { format, isValid } from "date-fns";

// --- TYPES ---
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

// --- HELPER: SEARCHABLE LEDGER SELECT ---
const SearchableRowLedgerSelect = ({
  rowIndex,
  row,
  ledgers = [],
  updateRow,
  companyId,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  const filteredOptions = useMemo(() => {
    if (!query) return ledgers.slice(0, 50);
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, "");
    return ledgers
      .filter((l: any) =>
        l.name.toLowerCase().replace(/\s+/g, "").includes(normalizedQuery),
      )
      .slice(0, 50);
  }, [ledgers, query]);

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
    <div
      className="relative w-full group"
      ref={searchRef}
      style={{ zIndex: isOpen ? 50 : 10 }}
    >
      <div className="flex gap-2">
        <div
          onClick={() => setIsOpen(true)}
          className={`relative flex-1 flex items-center h-9 px-3 bg-white border rounded-lg transition-all cursor-text shadow-sm ${
            isOpen
              ? "ring-2 ring-indigo-500 border-transparent"
              : "border-slate-200 hover:border-indigo-300"
          }`}
        >
          <Search
            size={14}
            className={`mr-2 ${isOpen ? "text-indigo-600" : "text-slate-400"}`}
          />

          {isOpen ? (
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-slate-800 uppercase"
            />
          ) : (
            <div
              className={`flex-1 text-[11px] font-bold uppercase truncate ${
                row.ledgerSearchTerm ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {row.ledgerSearchTerm || "Select Account..."}
            </div>
          )}
          <ChevronDown size={12} className="text-slate-400" />
        </div>

        <Link
          href={`/companies/${companyId}/ledgers/create`}
          target="_blank"
          className="h-9 w-9 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
          title="Create New Ledger"
        >
          <PlusCircle size={16} />
        </Link>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 min-w-[250px]">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {ledgers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-[10px] italic flex items-center justify-center gap-2">
                <Database size={14} /> No ledgers found
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => {
                    updateRow(rowIndex, "ledgerId", l.id.toString());
                    updateRow(rowIndex, "ledgerSearchTerm", l.name);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                >
                  <span className="text-[10px] font-bold text-slate-700 uppercase truncate">
                    {l.name}
                  </span>
                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {l.group?.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-[10px]">
                No matches for "{query}"
              </div>
            )}
          </div>

          <Link
            href={`/companies/${companyId}/ledgers/create`}
            target="_blank"
            className="p-3 bg-slate-50 border-t border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer relative z-50"
          >
            <PlusCircle size={14} /> Create New Ledger
            <ExternalLink size={10} className="opacity-50" />
          </Link>
        </div>
      )}
    </div>
  );
};

// --- MAIN FORM COMPONENT ---
export default function VoucherForm({
  companyId,
  ledgers = [],
  defaultType,
  isAdmin,
}: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createVoucher as any,
    initialState,
  );

  // --- TALLY DATE LOGIC ---
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

  // Ledger Filtering
  const { cashBankLedgers, otherLedgers } = useMemo(() => {
    const cashBank: any[] = [];
    const others: any[] = [];
    ledgers.forEach((l: any) => {
      const g = l.group?.name?.toLowerCase() || "";
      if (g.includes("cash") || g.includes("bank")) {
        cashBank.push(l);
      } else {
        others.push(l);
      }
    });
    return { cashBankLedgers: cashBank, otherLedgers: others };
  }, [ledgers]);

  const getLedgerOptionsForRow = (rowType: "Dr" | "Cr") => {
    switch (defaultType?.toUpperCase()) {
      case "CONTRA":
        return cashBankLedgers;
      case "JOURNAL":
        return otherLedgers;
      case "PAYMENT":
        return rowType === "Dr" ? otherLedgers : cashBankLedgers;
      case "RECEIPT":
        return rowType === "Dr" ? cashBankLedgers : otherLedgers;
      default:
        return ledgers;
    }
  };

  // Row State
  const [rows, setRows] = useState(
    defaultType?.toUpperCase() === "RECEIPT"
      ? [
          {
            ledgerId: "",
            type: "Cr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
          {
            ledgerId: "",
            type: "Dr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
        ]
      : [
          {
            ledgerId: "",
            type: "Dr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
          {
            ledgerId: "",
            type: "Cr" as const,
            amount: "",
            ledgerSearchTerm: "",
          },
        ],
  );

  const updateRow = (idx: number, field: string, value: string) => {
    const n: any = [...rows];
    n[idx][field] = value;
    if (field === "amount" && idx === 0 && rows.length === 2)
      n[1].amount = value;
    setRows(n);
  };

  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((s, r: any) => s + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((s, r: any) => s + (parseFloat(r.amount) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

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
    const isAutoVerified = state.message === "Authorized";
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div
          className={`absolute top-0 inset-x-0 h-2 ${
            isAutoVerified ? "bg-indigo-600" : "bg-emerald-600"
          }`}
        />
        <div className="relative z-10 w-full max-sm flex flex-col items-center">
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
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            {isAutoVerified ? "Voucher Authorized" : "Submitted for Approval"}
          </h2>
          <div
            className={`border px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8 ${
              isAutoVerified
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            Status:{" "}
            {isAutoVerified
              ? "Success (Auto-Verified)"
              : "Pending Verification"}
          </div>

          {/* ✅ RESTORED TXID AND VOUCHER ID BOX */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full shadow-inner mb-8 text-left">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Voucher No
              </span>
              <span className="text-lg font-black text-slate-900">
                #{state.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Secure TXID
              </span>
              <span className="text-sm font-mono font-bold text-indigo-600 tracking-tight bg-white px-2 py-1 rounded border border-slate-200">
                {state.txid || "---"}
              </span>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
              isAutoVerified
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-slate-900 hover:bg-indigo-600 text-white"
            }`}
          >
            Create Another Entry
          </button>
        </div>
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
      <input type="hidden" name="type" value={defaultType} />
      <input type="hidden" name="totalAmount" value={totalDr.toString()} />
      {/* ✅ ISO DATE HIDDEN INPUT */}
      <input type="hidden" name="date" value={dateValue} />

      <input
        type="hidden"
        name="ledgerEntries"
        value={JSON.stringify(
          rows.map((r) => ({
            ledgerId: r.ledgerId,
            amount:
              r.type === "Dr"
                ? -Math.abs(parseFloat(r.amount))
                : Math.abs(parseFloat(r.amount)),
          })),
        )}
      />

      {state?.error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-rose-100 rounded-full text-rose-600 mt-0.5 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
              Submission Failed
            </h4>
            <p className="text-[11px] font-medium text-rose-700 mt-1 leading-relaxed">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* ✅ TALLY-STYLE DATE INPUT */}
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
            Reference No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="OPTIONAL"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:font-normal"
          />
        </div>
        <div className="md:col-start-4">
          <label className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:text-indigo-600 text-slate-500 text-[10px] font-black uppercase tracking-wide transition-all shadow-sm">
            <Paperclip size={14} /> <span>Attach Proof</span>
            <input type="file" name="attachment" className="hidden" />
          </label>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-900 text-white p-3 text-[10px] font-black uppercase tracking-widest">
          <div className="col-span-2 text-center">Type</div>
          <div className="col-span-8 pl-2">Particulars</div>
          <div className="col-span-2 text-right pr-4">Amount</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50 min-h-[200px]">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 items-center px-2 py-1 group hover:bg-white transition-all rounded-lg relative"
            >
              <select
                value={row.type}
                onChange={(e) => updateRow(idx, "type", e.target.value)}
                className={`col-span-2 h-9 rounded-lg text-[10px] font-black pl-2 outline-none cursor-pointer border ${
                  row.type === "Dr"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : "bg-orange-50 text-orange-700 border-orange-100"
                }`}
              >
                <option value="Dr">Dr</option>
                <option value="Cr">Cr</option>
              </select>
              <div className="col-span-8">
                <SearchableRowLedgerSelect
                  rowIndex={idx}
                  row={row}
                  ledgers={getLedgerOptionsForRow(row.type)}
                  updateRow={updateRow}
                  companyId={companyId}
                />
              </div>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(idx, "amount", e.target.value)}
                className="col-span-2 h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
              {rows.length > 2 && (
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  className="absolute -right-1 opacity-0 group-hover:opacity-100 p-1 bg-rose-50 text-rose-500 rounded hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              {
                ledgerId: "",
                type: "Dr",
                amount: "",
                ledgerSearchTerm: "",
              },
            ])
          }
          className="w-full py-3 bg-white text-[10px] font-black text-slate-500 border-t border-slate-200 flex justify-center items-center gap-2 hover:text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-widest"
        >
          <Plus size={10} /> Add Entry Row
        </button>
      </div>

      {/* FOOTER SECTION */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <textarea
          name="narration"
          rows={3}
          className="w-full md:flex-1 p-4 border border-slate-200 rounded-2xl text-xs font-medium resize-none shadow-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
          placeholder="Enter narration..."
        />
        <div
          className={`w-full md:w-72 text-white p-5 rounded-2xl flex flex-col justify-between h-36 shadow-xl relative overflow-hidden ${
            isAdmin ? "bg-indigo-900" : "bg-slate-900"
          }`}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col text-[10px] font-bold border-b border-white/10 pb-3 space-y-1.5 relative z-10">
            <div className="flex justify-between text-indigo-200">
              <span>Dr Total:</span>{" "}
              <span className="font-mono text-white tracking-wide">
                {totalDr.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-orange-200">
              <span>Cr Total:</span>{" "}
              <span className="font-mono text-white tracking-wide">
                {totalCr.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-end relative z-10 pt-2">
            {!isBalanced ? (
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-1 rounded border border-rose-500/30">
                Unbalanced: {(totalDr - totalCr).toFixed(2)}
              </div>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> Balanced
              </div>
            )}
            <button
              type="submit"
              disabled={!isBalanced || isPending}
              className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95 ${
                isAdmin
                  ? "bg-indigo-500 text-white hover:bg-indigo-400"
                  : "bg-white text-slate-900 hover:bg-indigo-50"
              }`}
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : isAdmin ? (
                <ShieldCheck size={14} />
              ) : (
                <Save size={14} />
              )}
              {isPending ? "..." : isAdmin ? "Authorize Instantly" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
