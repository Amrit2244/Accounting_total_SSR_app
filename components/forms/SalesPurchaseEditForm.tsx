"use client";

import { useState, useActionState, useMemo, useRef, useEffect } from "react";
import { updateVoucher } from "@/app/actions/masters";
import {
  Plus,
  Save,
  AlertCircle,
  Loader2,
  Search,
  Trash2,
  ArrowLeft,
  ChevronDown,
  Percent,
  FileText,
  ShieldCheck, // New Icon for Admin mode
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---
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

export type FormState = {
  success?: boolean;
  message?: string | null;
  errors?: {
    voucherId?: string[];
    companyId?: string[];
    type?: string[];
    date?: string[];
    narration?: string[];
    structuredEntries?: string[];
    structuredInventory?: string[];
  };
};

type Props = {
  companyId: number;
  voucher: any;
  ledgers: Ledger[];
  items: Item[];
  type?: string;
  isAdmin?: boolean; // New prop for role detection
};

const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// --- Searchable Select Component ---
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
      ? options.find((o: any) => o.id.toString() === selectedId.toString())
          ?.name || ""
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
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {filteredOptions.map((l: any) => (
            <div
              key={l.id}
              onClick={() => {
                setSelectedId(l.id.toString());
                setSearchTerm(l.name);
                setIsOpen(false);
              }}
              className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors"
            >
              <span className="text-sm font-bold text-slate-700">{l.name}</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border uppercase font-black">
                {l.group.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN FORM ---
export default function SalesPurchaseEditForm({
  companyId,
  voucher,
  ledgers,
  items,
  type = "SALES",
  isAdmin = false, // Default to false
}: Props) {
  const router = useRouter();
  const initialState: FormState = { success: false, message: null };
  const [state, action, isPending] = useActionState(
    updateVoucher as any,
    initialState
  );

  // Initial State Mappings
  const initialParty =
    voucher.partyLedgerId?.toString() ||
    voucher.ledgerEntries?.[0]?.ledgerId?.toString() ||
    "";
  const initialAccount =
    voucher.ledgerEntries
      ?.find((le: any) => le.amount < 0)
      ?.ledgerId?.toString() || "";
  const initialTaxLedger = voucher.taxLedgerId?.toString() || "";

  const [partyId, setPartyId] = useState(initialParty);
  const [accountId, setAccountId] = useState(initialAccount);
  const [enableTax, setEnableTax] = useState(!!initialTaxLedger);
  const [taxLedgerId, setTaxLedgerId] = useState(initialTaxLedger);

  const [rows, setRows] = useState<VoucherRow[]>(
    voucher.inventoryEntries?.length > 0
      ? voucher.inventoryEntries.map((inv: any) => ({
          itemId: inv.stockItemId.toString(),
          qty: Math.abs(inv.quantity).toString(),
          rate: inv.rate.toString(),
          gst: items.find((i) => i.id === inv.stockItemId)?.gstRate || 0,
          amount: Math.abs(inv.amount),
          taxAmount:
            Math.abs(inv.amount) *
            ((items.find((i) => i.id === inv.stockItemId)?.gstRate || 0) / 100),
        }))
      : [{ itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 }]
  );

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

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

  useEffect(() => {
    if (state?.success) {
      router.push(`/companies/${companyId}/vouchers`);
      router.refresh();
    }
  }, [state, companyId, router]);

  return (
    <form action={action} className="w-full h-full flex flex-col font-sans p-1">
      <input type="hidden" name="voucherId" value={voucher.id} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="structuredEntries"
        value={JSON.stringify([
          {
            ledgerId: partyId,
            amount: type === "SALES" ? grandTotal : -grandTotal,
          },
          {
            ledgerId: accountId,
            amount: type === "SALES" ? -totalBaseAmount : totalBaseAmount,
          },
          ...(enableTax
            ? [
                {
                  ledgerId: taxLedgerId,
                  amount: type === "SALES" ? -totalTaxAmount : totalTaxAmount,
                },
              ]
            : []),
        ])}
      />
      <input
        type="hidden"
        name="structuredInventory"
        value={JSON.stringify(
          rows
            .map((r) => ({
              stockItemId: r.itemId,
              quantity: r.qty,
              rate: r.rate,
            }))
            .filter((r) => r.stockItemId !== "")
        )}
      />

      {state?.message && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          <AlertCircle size={20} />
          <span className="font-bold text-xs uppercase tracking-wide">
            {state.message}
          </span>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isAdmin ? "bg-emerald-500" : "bg-indigo-500"
          }`}
        />
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date(voucher.date).toISOString().split("T")[0]}
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
            required
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label
            className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
              isAdmin ? "text-emerald-600" : "text-indigo-600"
            }`}
          >
            Vch No.
          </label>
          <div className="relative">
            <FileText
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isAdmin ? "text-emerald-400" : "text-indigo-400"
              }`}
            />
            <input
              name="voucherNo"
              type="text"
              defaultValue={voucher.voucherNo}
              className="w-full h-11 border border-slate-100 bg-white rounded-xl pl-10 pr-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              required
            />
          </div>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Ref
          </label>
          <input
            name="reference"
            type="text"
            defaultValue={voucher.reference || ""}
            className="w-full h-11 border border-slate-200 bg-white rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label="Party Account"
            name="partyLedgerId_input"
            options={partyLedgersImpl}
            selectedId={partyId}
            setSelectedId={setPartyId}
            isRequired
            placeholder="Select Party..."
          />
        </div>
        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label={`${type} Ledger`}
            name="accountLedgerId_input"
            options={accountLedgersImpl}
            selectedId={accountId}
            setSelectedId={setAccountId}
            isRequired
            placeholder="Select Account..."
          />
        </div>
      </div>

      {/* --- TAX CONFIG --- */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setEnableTax(!enableTax)}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
              enableTax
                ? "bg-emerald-100 text-emerald-700 shadow-inner"
                : "bg-white text-slate-400"
            }`}
          >
            <Percent size={14} /> {enableTax ? "Tax Active" : "Add Tax"}
          </button>
          {enableTax && (
            <div className="relative group">
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
              />
              <select
                value={taxLedgerId}
                onChange={(e) => setTaxLedgerId(e.target.value)}
                className="h-9 pl-4 pr-9 border-l border-slate-200 text-xs font-bold text-slate-700 bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="">-- Select Tax --</option>
                {taxLedgersImpl.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Admin Super-User Mode
            </span>
          </div>
        )}
      </div>

      {/* --- ITEMS --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
        <div
          className={`grid grid-cols-12 text-white py-4 px-4 text-[10px] uppercase font-black tracking-widest ${
            isAdmin ? "bg-slate-800" : "bg-slate-900"
          }`}
        >
          <div className="col-span-5 pl-2">Item Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Total</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-100 bg-slate-50/30">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 px-4 py-3 items-center gap-4 hover:bg-white group transition-colors"
            >
              <div className="col-span-5">
                <select
                  className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs font-bold text-slate-700 outline-none bg-white appearance-none"
                  value={row.itemId}
                  onChange={(e) => updateRow(idx, "itemId", e.target.value)}
                >
                  <option value="">Select Stock...</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold bg-white"
                value={row.qty}
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
              />
              <input
                type="number"
                className="col-span-2 h-10 border border-slate-200 rounded-lg px-3 text-right text-xs font-bold bg-white"
                value={row.rate}
                onChange={(e) => updateRow(idx, "rate", e.target.value)}
              />
              <div className="col-span-2 text-right pr-4 font-mono font-bold text-slate-900">
                {formatCurrency(row.amount)}
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
          className="w-full py-4 text-[10px] font-black uppercase text-slate-500 bg-slate-50 hover:bg-indigo-50 border-t border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Row
        </button>
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-auto flex flex-col md:flex-row justify-between items-start gap-8 border-t border-slate-200 pt-8">
        <textarea
          name="narration"
          defaultValue={voucher.narration || ""}
          placeholder="Notes..."
          className="w-full md:flex-1 h-32 border border-slate-200 rounded-xl p-4 text-sm font-medium bg-slate-50 focus:bg-white outline-none"
        />
        <div
          className={`p-8 rounded-3xl w-full md:w-[400px] shadow-2xl relative overflow-hidden text-white ${
            isAdmin ? "bg-emerald-950" : "bg-slate-900"
          }`}
        >
          <div
            className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
              isAdmin ? "bg-emerald-500/30" : "bg-blue-500/30"
            }`}
          />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between text-xs font-bold opacity-60 uppercase">
              <span>Subtotal</span>
              <span className="font-mono">
                {formatCurrency(totalBaseAmount)}
              </span>
            </div>
            {enableTax && (
              <div className="flex justify-between text-xs font-bold opacity-60 uppercase pb-4 border-b border-white/10">
                <span>GST</span>
                <span className="font-mono text-emerald-400">
                  + {formatCurrency(totalTaxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isAdmin ? "text-emerald-400" : "text-blue-400"
                }`}
              >
                Grand Total
              </span>
              <span className="text-3xl font-mono font-bold">
                ₹{formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="sticky bottom-4 z-50 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl flex justify-between items-center mt-8">
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors px-4"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className={`px-10 py-3 rounded-xl font-black uppercase text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
            isAdmin
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
              : "bg-slate-900 hover:bg-indigo-600 text-white"
          }`}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : isAdmin ? (
            <ShieldCheck size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{isAdmin ? "Authorize & Update" : "Save Changes"}</span>
        </button>
      </div>
    </form>
  );
}
