"use client";

import {
  useState,
  useActionState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
// FIX 1: Using relative path to resolve Module Not Found error.
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

// --- UTILITY FUNCTIONS ---
/** Formats a number to Indian currency standard (e.g., 1,23,456.00) */
const formatCurrency = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
// -------------------------

// --- TYPES ---
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
  // itemSearchTerm is removed as it's no longer needed for standard select
};

type Props = {
  companyId: number;
  type: string;
  ledgers: Ledger[];
  items: Item[];
};

// --- REUSABLE SEARCHABLE LEDGER SELECT COMPONENT (Combobox) ---
type SearchSelectProps = {
  label: string;
  name: string;
  options: Ledger[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  isRequired: boolean;
  placeholder: string;
};

const SearchableLedgerSelect: React.FC<SearchSelectProps> = ({
  label,
  name,
  options,
  selectedId,
  setSelectedId,
  isRequired,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState(
    selectedId
      ? options.find((o) => o.id.toString() === selectedId)?.name || ""
      : ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 50);
    return options
      .filter((o) => o.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 50);
  }, [searchTerm, options]);

  // Handle selection from the list
  const handleSelect = (ledger: Ledger) => {
    setSelectedId(ledger.id.toString());
    setSearchTerm(ledger.name);
    setIsOpen(false);
  };

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set display text if selectedId changes externally
  useEffect(() => {
    if (selectedId) {
      const selected = options.find((o) => o.id.toString() === selectedId);
      if (selected) setSearchTerm(selected.name);
    } else {
      setSearchTerm(""); // Clear display if selection is cleared
    }
  }, [selectedId, options]);

  return (
    <div className="relative" ref={searchRef}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>

      {/* Hidden Input for Form Submission */}
      <input
        type="hidden"
        name={name}
        value={selectedId}
        required={isRequired}
      />

      {/* Search Input Box */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const term = e.target.value;
            setSearchTerm(term);
            setIsOpen(true);
            // Clear selectedId if input text doesn't match current selection
            if (
              selectedId &&
              term !== options.find((o) => o.id.toString() === selectedId)?.name
            ) {
              setSelectedId("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full h-10 pl-9 pr-2 border ${
            selectedId ? "border-green-500" : "border-slate-300"
          } rounded-md text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm`}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((l) => (
              <div
                key={l.id}
                onClick={() => handleSelect(l)}
                className="p-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center"
              >
                <span className="font-medium text-slate-800">{l.name}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {l.group.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-slate-500 italic">
              No matches found for "{searchTerm}".
            </div>
          )}
        </div>
      )}
      {!selectedId && isRequired && (
        <p className="text-xs text-red-500 mt-1">Selection required.</p>
      )}
    </div>
  );
};
// -------------------------------------------------------------

export default function SalesPurchaseForm({
  companyId,
  type,
  ledgers,
  items,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Form State
  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [enableTax, setEnableTax] = useState(true);
  const [taxLedgerId, setTaxLedgerId] = useState("");
  const [showTaxOptions, setShowTaxOptions] = useState(false);

  // Rows State
  const [rows, setRows] = useState<VoucherRow[]>([
    { itemId: "", qty: "", rate: "", gst: 0, amount: 0, taxAmount: 0 },
  ]);

  // --- FILTER LEDGERS ---
  const partyLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) => {
        const g = l.group.name.toLowerCase();

        const isPartyGroup =
          g.includes("debtor") ||
          g.includes("creditor") ||
          g.includes("cash") ||
          g.includes("bank") ||
          g === "sales ledger" ||
          g === "sale a/c";

        return isPartyGroup;
      }),
    [ledgers]
  );

  const accountLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) => {
        const g = l.group.name.toLowerCase();

        if (type === "SALES") {
          return (
            g === "sales accounts" || g === "sales a/c" || g === "direct income"
          );
        }

        if (type === "PURCHASE") {
          return (
            g === "purchase accounts" ||
            g === "purchase a/c" ||
            g === "direct expense"
          );
        }

        return false;
      }),
    [ledgers, type]
  );

  const taxLedgersImpl = useMemo(
    () =>
      ledgers.filter(
        (l) =>
          l.group.name.toLowerCase().includes("duties") ||
          l.group.name.toLowerCase().includes("tax") ||
          l.group.name.toLowerCase().includes("gst")
      ),
    [ledgers]
  );

  // --- ROW LOGIC (Adjusted for simple item select) ---
  const updateRow = (
    index: number,
    field: keyof VoucherRow,
    value: string | number
  ) => {
    const newRows = [...rows];
    /* @ts-ignore */
    newRows[index][field] = value;

    // Handle Item ID selection from simple <select>
    if (field === "itemId") {
      const selectedItem = items.find((i) => i.id.toString() === value);
      if (selectedItem) {
        newRows[index].gst = selectedItem.gstRate || 0;
      }
    }

    const q = parseFloat(newRows[index].qty.toString()) || 0;
    const r = parseFloat(newRows[index].rate.toString()) || 0;
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

  // --- KEYBOARD SHORTCUT LOGIC (F4 to Save) ---
  const handleKeyboardSubmit = useCallback((event: KeyboardEvent) => {
    if (event.key === "F4" && formRef.current) {
      event.preventDefault();
      const submitButton = formRef.current.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardSubmit);
    return () => {
      document.removeEventListener("keydown", handleKeyboardSubmit);
    };
  }, [handleKeyboardSubmit]);
  // ---------------------------------------------

  // --- SUCCESS SCREEN (Omitted for brevity) ---
  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-green-50 border-2 border-dashed border-green-200 rounded-2xl shadow-md">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {type} Invoice Created
        </h2>
        <p className="text-slate-500 mb-8">
          Transaction ID:{" "}
          <span className="font-mono font-bold text-black">{state.code}</span>
        </p>
        <div className="flex gap-4">
          {state.id && (
            <Link
              href={`/companies/${companyId}/vouchers/${state.id}/print`}
              target="_blank"
              className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-black transition-colors flex items-center gap-2 text-sm"
            >
              <Printer size={18} /> Print Invoice
            </Link>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors text-sm"
          >
            Create Another {type}
          </button>
          <Link
            href={`/companies/${companyId}/vouchers`}
            className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors text-sm"
          >
            Go to Daybook
          </Link>
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

      {/* --- HEADER SECTION --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md mb-4">
        {/* ROW 1: Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
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
              className="w-full h-10 border border-slate-300 px-2 rounded-md text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>

          {/* 2. Reference No */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Reference No
            </label>
            <input
              name="reference"
              type="text"
              placeholder="e.g. INV-001"
              className="w-full h-10 border border-slate-300 px-2 rounded-md text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>

          {/* 3. Party Name (Using Reusable Component) */}
          <div className="md:col-span-4">
            <SearchableLedgerSelect
              label="Party A/c Name"
              name="partyLedgerId"
              options={partyLedgersImpl}
              selectedId={partyId}
              setSelectedId={setPartyId}
              isRequired={true}
              placeholder="Search Customer/Supplier..."
            />
          </div>

          {/* 4. Sales/Purchase Ledger (Using Reusable Component) */}
          <div className="md:col-span-4">
            <SearchableLedgerSelect
              label={`${type} Account`}
              name="salesPurchaseLedgerId"
              options={accountLedgersImpl}
              selectedId={accountId}
              setSelectedId={setAccountId}
              isRequired={true}
              placeholder={`Select ${type} Ledger...`}
            />
          </div>
        </div>

        {/* ROW 2: Taxation Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-6">
          {/* Tax Toggle */}
          <div className="md:col-span-12 flex items-center gap-4">
            <div
              onClick={() => {
                setEnableTax(!enableTax);
                setShowTaxOptions(false); // Hide advanced options when toggling off
              }}
              className={`h-8 px-4 py-1.5 rounded-lg border cursor-pointer flex items-center gap-2 select-none transition-colors shadow-sm ${
                enableTax
                  ? "bg-green-100 border-green-300 text-green-700 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-500 font-medium"
              }`}
            >
              <Settings2 size={14} />
              <span className="text-[10px] uppercase">
                {enableTax ? "Tax Enabled" : "Enable Tax"}
              </span>
            </div>

            {enableTax && (
              <button
                type="button"
                onClick={() => setShowTaxOptions(!showTaxOptions)}
                className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase transition-colors text-blue-600 hover:bg-blue-50"
              >
                {showTaxOptions
                  ? "Hide Advanced Tax"
                  : "Show Advanced Tax Fields"}
              </button>
            )}

            {enableTax && showTaxOptions && (
              <div className="flex-1 flex gap-4 animate-in fade-in zoom-in-95 duration-200">
                <input
                  name="placeOfSupply"
                  type="text"
                  placeholder="Place of Supply (State)"
                  className="h-10 border border-slate-300 px-3 rounded-md text-sm font-semibold text-slate-700 w-1/3 outline-none shadow-sm"
                />
                <input
                  name="partyGstin"
                  type="text"
                  placeholder="Party GSTIN"
                  className="h-10 border border-slate-300 px-3 rounded-md text-sm font-semibold text-slate-700 w-1/3 outline-none uppercase shadow-sm"
                />
                {/* Tax Ledger Select (Using Reusable Component) */}
                <div className="w-1/3">
                  <SearchableLedgerSelect
                    label="Tax Ledger"
                    name="taxLedgerId"
                    options={taxLedgersImpl}
                    selectedId={taxLedgerId}
                    setSelectedId={setTaxLedgerId}
                    isRequired={enableTax}
                    placeholder="Select GST/Tax Ledger..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- INVENTORY TABLE SECTION --- */}
      <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-md">
        <div className="grid grid-cols-12 bg-slate-800 text-white p-2 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
          <div className="col-span-4 pl-2">Item Description</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right pr-4">
            Amount ({enableTax ? "Taxable" : "Total"})
          </div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto bg-white max-h-[400px]">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-12 p-1.5 items-center hover:bg-blue-50/50 transition-colors group"
            >
              {/* ITEM SELECT (Simple Dropdown) */}
              <div className="col-span-4 px-1 relative">
                <select
                  value={row.itemId}
                  name={`itemId-${index}`}
                  onChange={(e) => updateRow(index, "itemId", e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm bg-white"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} {i.gstRate > 0 && `(GST ${i.gstRate}%)`}
                    </option>
                  ))}
                </select>
                {/* Display GST rate visually if an item is selected */}
                {row.gst > 0 && row.itemId && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold pointer-events-none">
                    GST {row.gst}%
                  </span>
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-2 px-1">
                <input
                  type="number"
                  step="0.01"
                  value={row.qty}
                  name={`qty-${index}`}
                  onChange={(e) => updateRow(index, "qty", e.target.value)}
                  placeholder="0"
                  className="w-full h-8 text-right px-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm"
                  required
                />
              </div>

              {/* Rate */}
              <div className="col-span-2 px-1">
                <input
                  type="number"
                  step="0.01"
                  value={row.rate}
                  name={`rate-${index}`}
                  onChange={(e) => updateRow(index, "rate", e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 text-right px-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none shadow-sm"
                  required
                />
              </div>

              {/* Amount */}
              <div className="col-span-3 px-2 text-right pr-4 font-mono font-bold text-slate-700 text-sm">
                {formatCurrency(row.amount)}
              </div>

              {/* Action */}
              <div className="col-span-1 text-center">
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
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
          onClick={addRow}
          className="flex items-center justify-center gap-2 p-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t border-slate-200 transition-colors mt-auto"
        >
          <Plus size={14} /> Add Inventory Line
        </button>
      </div>

      {/* --- FOOTER SECTION (TOTALS & SUBMIT) --- */}
      <div className="mt-4 flex gap-4 items-start">
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

        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-xl w-72">
          <div className="flex justify-between items-center text-xs font-medium text-blue-100 mb-1">
            <span>Sub Total (Taxable)</span>
            <span className="font-mono">{formatCurrency(totalBaseAmount)}</span>
          </div>

          {enableTax && (
            <div className="flex justify-between items-center text-xs font-bold text-orange-300 mb-2 pb-2 border-b border-white/10">
              <span>Output Tax (GST)</span>
              <span className="font-mono">
                {formatCurrency(totalTaxAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold uppercase tracking-wide">
              Grand Total
            </span>
            <span className="text-3xl font-mono font-bold text-yellow-400 leading-none flex items-center gap-1">
              <IndianRupee size={20} />
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> PROCESSING...
            </>
          ) : (
            <>
              <Save size={18} /> SAVE {type} INVOICE (F4)
            </>
          )}
        </button>
      </div>
    </form>
  );
}
