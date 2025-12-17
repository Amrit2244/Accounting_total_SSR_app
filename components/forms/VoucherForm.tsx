"use client";

import {
  useState,
  useActionState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
// FIX 1: Corrected the import path to the assumed relative path 'actions/vouchers'
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Copy,
  Printer,
  Loader2,
  Calendar,
  MessageSquareText,
  IndianRupee,
  Search, // Added Search icon
} from "lucide-react";
import Link from "next/link";

// --- UTILITY FUNCTIONS ---
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

type VoucherRowState = {
  ledgerId: string;
  type: "Dr" | "Cr";
  amount: string;
  ledgerSearchTerm?: string;
};

type Props = {
  companyId: number;
  ledgers: Ledger[];
  defaultType: string;
};

// --- SEARCHABLE LEDGER SELECT FOR VOUCHER ROWS ---
type SearchRowSelectProps = {
  rowIndex: number;
  row: VoucherRowState;
  filteredOptions: Ledger[];
  updateRow: (
    index: number,
    field: keyof VoucherRowState,
    value: string
  ) => void;
};

const SearchableRowLedgerSelect: React.FC<SearchRowSelectProps> = ({
  rowIndex,
  row,
  filteredOptions,
  updateRow,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle selection from the list
  const handleSelect = (ledger: Ledger) => {
    updateRow(rowIndex, "ledgerId", ledger.id.toString());
    updateRow(rowIndex, "ledgerSearchTerm", ledger.name); // Update display text
    setIsOpen(false);
    // Focus the amount field next
    document
      .querySelector<HTMLInputElement>(`input[name="amount-${rowIndex}"]`)
      ?.focus();
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

  // Auto-set search term when ledgerId changes (e.g., when adding a new row or editing a loaded voucher)
  useEffect(() => {
    if (row.ledgerId && !row.ledgerSearchTerm) {
      const selected = filteredOptions.find(
        (l) => l.id.toString() === row.ledgerId
      );
      if (selected) {
        updateRow(rowIndex, "ledgerSearchTerm", selected.name);
      }
    }
  }, [
    row.ledgerId,
    row.ledgerSearchTerm,
    filteredOptions,
    rowIndex,
    updateRow,
  ]);

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Hidden Input for Form Submission - used for form data */}
      <input
        type="hidden"
        name={`ledgerId-${rowIndex}`}
        value={row.ledgerId}
        required
      />

      {/* Search Input Box */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={row.ledgerSearchTerm || ""}
          onChange={(e) => {
            const term = e.target.value;
            updateRow(rowIndex, "ledgerSearchTerm", term);
            setIsOpen(true);
            // Clear selectedId if input text doesn't match current selection
            if (row.ledgerId) {
              updateRow(rowIndex, "ledgerId", "");
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search ledger..."
          className={`w-full h-10 pl-9 pr-2 border ${
            row.ledgerId ? "border-green-500" : "border-slate-300"
          } rounded-md text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm`}
          required
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          className="absolute z-20 w-[400px] bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          // Force position to break out of the grid column
          style={{ left: 0 }}
        >
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
              No matches found for "{row.ledgerSearchTerm}".
            </div>
          )}
        </div>
      )}
      {!row.ledgerId && (
        <p className="text-xs text-red-500 mt-1">Ledger selection required.</p>
      )}
    </div>
  );
};
// -------------------------------------------------------------

export default function VoucherForm({
  companyId,
  ledgers,
  defaultType,
}: Props) {
  const [state, action, isPending] = useActionState(createVoucher, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const initialRows: VoucherRowState[] =
    defaultType === "RECEIPT"
      ? [
          { ledgerId: "", type: "Cr", amount: "", ledgerSearchTerm: "" },
          { ledgerId: "", type: "Dr", amount: "", ledgerSearchTerm: "" },
        ]
      : [
          { ledgerId: "", type: "Dr", amount: "", ledgerSearchTerm: "" },
          { ledgerId: "", type: "Cr", amount: "", ledgerSearchTerm: "" },
        ];

  const [rows, setRows] = useState(initialRows);

  // --- FILTER LOGIC (Optimized) ---
  const getFilteredLedgers = (rowType: "Dr" | "Cr") => {
    const isCashOrBank = (groupName: string) => {
      const g = groupName.toLowerCase();
      return g.includes("cash") || g.includes("bank");
    };

    return ledgers.filter((ledger) => {
      const group = ledger.group.name;
      switch (defaultType) {
        case "CONTRA":
          return isCashOrBank(group);
        case "PAYMENT":
          if (rowType === "Cr") return isCashOrBank(group);
          return true;
        case "RECEIPT":
          if (rowType === "Dr") return isCashOrBank(group);
          return true;
        case "JOURNAL":
          return !isCashOrBank(group);
        default:
          return true;
      }
    });
  };

  // --- FORM LOGIC ---
  const addRow = () =>
    setRows([
      ...rows,
      { ledgerId: "", type: "Dr", amount: "", ledgerSearchTerm: "" },
    ]);

  const removeRow = (index: number) => {
    if (rows.length > 2) {
      const n = [...rows];
      n.splice(index, 1);
      setRows(n);
    }
  };

  // NOTE: updateRow now accepts keyof VoucherRowState
  const updateRow = (
    index: number,
    field: keyof VoucherRowState,
    value: string
  ) => {
    const n = [...rows];
    /* @ts-ignore */ n[index][field] = value;

    // Auto-fill amount logic (Only fill if exactly one amount field is empty)
    const debitRows = n.filter((r) => r.type === "Dr");
    const creditRows = n.filter((r) => r.type === "Cr");

    let emptyRow = null;
    let emptyCount = 0;

    for (const row of n) {
      if (!row.amount) {
        emptyCount++;
        emptyRow = row;
      }
    }

    if (emptyCount === 1 && field !== "amount" && emptyRow?.ledgerId) {
      const currentDr = debitRows.reduce(
        (sum, r) => sum + (parseFloat(r.amount) || 0),
        0
      );
      const currentCr = creditRows.reduce(
        (sum, r) => sum + (parseFloat(r.amount) || 0),
        0
      );
      const currentDiff = currentDr - currentCr;

      if (currentDiff !== 0) {
        const amountToFill = Math.abs(currentDiff).toFixed(2);

        if (emptyRow?.type === "Dr" && currentDiff < 0) {
          emptyRow.amount = amountToFill;
        } else if (emptyRow?.type === "Cr" && currentDiff > 0) {
          emptyRow.amount = amountToFill;
        }
      }
    }

    setRows(n);
  };

  // Calculate Totals and Balance
  const totalDr = rows
    .filter((r) => r.type === "Dr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalCr = rows
    .filter((r) => r.type === "Cr")
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const difference = totalDr - totalCr;
  const isBalanced = Math.abs(difference) < 0.01;

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
          Voucher Created Successfully
        </h2>
        <p className="text-slate-500 mb-8">
          Transaction Code: <b>{state.code}</b>. It is currently in **PENDING**
          status.
        </p>
        <div
          className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-xl relative group cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => navigator.clipboard.writeText(state.code)}
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Transaction ID (Click to Copy)
          </p>
          <div className="text-5xl font-mono font-black text-blue-600 tracking-[0.2em]">
            {state.code}
          </div>
          <div className="absolute top-3 right-3 text-slate-300 group-hover:text-blue-500 transition-colors">
            <Copy size={20} />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          {state.id && (
            <Link
              href={`/companies/${companyId}/vouchers/${state.id}/print`}
              target="_blank"
              className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-black transition-colors flex items-center gap-2 text-sm"
            >
              <Printer size={18} /> Print Voucher
            </Link>
          )}

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors text-sm"
          >
            Create Another {defaultType}
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

  // Render the form
  return (
    <form
      ref={formRef}
      action={action}
      className="w-full h-full flex flex-col font-sans"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={defaultType} />
      {/* Pass the dynamic rows array to the Server Action */}
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />{" "}
          <span className="font-bold">{state.error}</span>
        </div>
      )}

      {/* --- VOUCHER DETAILS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Voucher Date
          </label>
          <div className="relative">
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full pl-10 pr-4 border border-slate-300 p-2.5 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Narration
          </label>
          <div className="relative">
            <MessageSquareText
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              name="narration"
              type="text"
              placeholder="Being amount paid for..."
              className="w-full pl-10 pr-4 border border-slate-300 p-2.5 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* --- ENTRY LINES TABLE --- */}
      <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-md">
        <div className="grid grid-cols-12 bg-slate-800 text-white p-3 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
          <div className="col-span-1 text-center">Type</div>
          <div className="col-span-8 pl-4">Ledger Account</div>
          <div className="col-span-2 text-right pr-4">Amount (₹)</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
          {rows.map((row, index) => {
            // Get all ledgers relevant for this voucher type and Dr/Cr side
            const relevantLedgers = getFilteredLedgers(row.type);

            // Filter these relevant ledgers based on the user's search term
            const filteredOptions = row.ledgerSearchTerm
              ? relevantLedgers
                  .filter((l) =>
                    l.name
                      .toLowerCase()
                      .includes(row.ledgerSearchTerm!.toLowerCase())
                  )
                  .slice(0, 50)
              : relevantLedgers.slice(0, 50);

            return (
              <div
                key={index}
                className="grid grid-cols-12 p-2 items-center hover:bg-slate-50 transition-colors"
              >
                {/* 1. Dr/Cr Type */}
                <div className="col-span-1 px-2">
                  <select
                    value={row.type}
                    // FIX: Ensure the updateRow call uses the correct field name 'type'
                    onChange={(e) => updateRow(index, "type", e.target.value)}
                    className={`w-full font-bold p-2 rounded border text-xs cursor-pointer ${
                      row.type === "Dr"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-orange-700 bg-orange-50 border-orange-200"
                    }`}
                  >
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </div>

                {/* 2. Ledger Dropdown (Using Searchable Component) */}
                <div className="col-span-8 px-2 relative">
                  <SearchableRowLedgerSelect
                    rowIndex={index}
                    row={row}
                    filteredOptions={filteredOptions}
                    updateRow={updateRow}
                  />
                </div>

                {/* 3. Amount */}
                <div className="col-span-2 px-2 relative">
                  <IndianRupee
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    name={`amount-${index}`} // Added name for potential focus script
                    // FIX: Ensure the updateRow call uses the correct field name 'amount'
                    onChange={(e) => updateRow(index, "amount", e.target.value)}
                    placeholder="0.00"
                    className="w-full text-right pl-7 p-2 rounded border border-slate-300 font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-50 outline-none text-sm"
                    required
                  />
                </div>

                {/* 4. Remove Button */}
                <div className="col-span-1 text-center">
                  {rows.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 p-3 text-sm font-bold text-blue-600 bg-slate-100 hover:bg-slate-200 border-t border-slate-300 transition-colors mt-auto"
        >
          <Plus size={16} /> Add Ledger Line
        </button>
      </div>

      {/* --- FOOTER: TOTALS AND SUBMIT --- */}
      <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg border-2 border-slate-200 shadow-xl">
        <div className="text-sm space-y-1">
          <div className="text-slate-500 flex items-center gap-4">
            <span className="font-bold text-slate-800">Total Debit:</span>
            <span className="font-mono font-extrabold text-blue-700 text-lg">
              {formatCurrency(totalDr)}
            </span>
          </div>
          <div className="text-slate-500 flex items-center gap-4">
            <span className="font-bold text-slate-800">Total Credit:</span>
            <span className="font-mono font-extrabold text-orange-700 text-lg">
              {formatCurrency(totalCr)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-500 uppercase">
              Difference
            </span>
            <span
              className={`font-mono font-black text-xl ${
                !isBalanced ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(difference)}{" "}
              {isBalanced ? " (Tally)" : " (Error)"}
            </span>
          </div>

          <button
            type="submit"
            disabled={!isBalanced || isPending}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> SAVING...
              </>
            ) : (
              <>
                <Save size={18} /> SAVE VOUCHER (F4)
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
