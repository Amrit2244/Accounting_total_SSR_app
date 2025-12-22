"use client";

import { useState, useActionState, useMemo, useRef, useEffect } from "react";
// Import State type so we can match it
import { updateVoucher, State } from "@/app/actions/voucher";
import {
  Plus,
  Save,
  AlertCircle,
  Loader2,
  Search,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Types
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
  voucher: any;
  ledgers: Ledger[];
  items: Item[];
  type?: string;
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

// --- MAIN FORM ---
export default function SalesPurchaseEditForm({
  companyId,
  voucher,
  ledgers,
  items,
  type = "SALES",
}: Props) {
  const router = useRouter();

  // ✅ FIX: Use a properly typed initial state matching the server action
  const initialState: State = { success: false, error: "", message: "" };
  const [state, action, isPending] = useActionState(
    updateVoucher,
    initialState
  );

  // Initial Mappings
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

  // Initialize Rows
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

  // Filters
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
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  useEffect(() => {
    if (state?.success) {
      router.push(`/companies/${companyId}/vouchers`);
      router.refresh();
    }
  }, [state, companyId, router]);

  return (
    <form action={action} className="w-full h-full flex flex-col font-sans">
      <input type="hidden" name="voucherId" value={voucher.id} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-bold text-xs uppercase tracking-wide">
            {state.error}
          </span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date(voucher.date).toISOString().split("T")[0]}
            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 block">
            Voucher No
          </label>
          <input
            name="voucherNo"
            type="text"
            defaultValue={voucher.voucherNo}
            className="w-full h-10 border-2 border-blue-100 bg-blue-50/20 rounded-lg px-3 font-bold text-slate-800 outline-none"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
            Reference
          </label>
          <input
            name="reference"
            type="text"
            defaultValue={voucher.reference || ""}
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

      {/* TAX & ITEM SECTION */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnableTax(!enableTax)}
            className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              enableTax
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-500 border-slate-300"
            }`}
          >
            {enableTax ? "GST Enabled" : "Enable GST"}
          </button>
          {enableTax && (
            <select
              value={taxLedgerId}
              onChange={(e) => setTaxLedgerId(e.target.value)}
              className="h-9 border border-emerald-300 rounded-lg px-3 text-xs font-bold text-emerald-800 bg-emerald-50 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Select Tax Ledger --</option>
              {taxLedgersImpl.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="flex-1 bg-white border border-slate-300 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-12 bg-slate-900 text-white py-3 px-2 text-[10px] uppercase font-black tracking-wider">
          <div className="col-span-5 pl-2">Item Details</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right pr-4">Amount</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 p-2 items-center gap-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="col-span-5">
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-xs font-bold text-slate-700 outline-none"
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
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-right text-xs font-mono"
                  value={row.qty}
                  onChange={(e) => updateRow(idx, "qty", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  className="w-full h-9 border border-slate-200 rounded-md px-2 text-right text-xs font-mono"
                  value={row.rate}
                  onChange={(e) => updateRow(idx, "rate", e.target.value)}
                />
              </div>
              <div className="col-span-2 text-right pr-4 font-mono font-bold text-slate-800 text-sm">
                {formatCurrency(row.amount)}
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
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
          className="w-full py-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border-t border-slate-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Line Item
        </button>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-6">
        <textarea
          name="narration"
          defaultValue={voucher.narration || ""}
          placeholder="Enter narration..."
          className="w-full md:w-1/2 h-24 border border-slate-300 rounded-xl p-4 text-xs font-medium resize-none bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="bg-slate-900 text-white p-6 rounded-2xl w-full md:w-96 shadow-xl">
          <div className="flex justify-between text-[11px] mb-2 font-bold text-slate-400 uppercase">
            <span>Subtotal</span>
            <span className="font-mono text-white text-sm">
              {formatCurrency(totalBaseAmount)}
            </span>
          </div>
          {enableTax && (
            <div className="flex justify-between text-[11px] mb-4 border-b border-white/10 pb-4 font-bold text-slate-400 uppercase">
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

      <div className="mt-8 flex justify-between items-center pb-8">
        <Link
          href={`/companies/${companyId}/vouchers`}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Back to Daybook
        </Link>
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className="bg-[#003366] hover:bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all flex items-center gap-3"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          Update Voucher
        </button>
      </div>
    </form>
  );
}
