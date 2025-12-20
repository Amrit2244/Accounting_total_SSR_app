"use client";

import {
  useState,
  useActionState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createVoucher } from "@/app/actions/voucher";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Printer,
  Loader2,
  IndianRupee,
  Search,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface FormState {
  success?: boolean;
  error?: string;
  code?: string;
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

// RESTORED COMPONENT: SEARCHABLE SELECT
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
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
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
          className="w-full h-10 pl-9 pr-3 border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
          {filteredOptions.map((l: any) => (
            <div
              key={l.id}
              onClick={() => {
                setSelectedId(l.id.toString());
                setSearchTerm(l.name);
                setIsOpen(false);
              }}
              className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0"
            >
              <span className="text-sm font-bold text-slate-800">{l.name}</span>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase font-bold">
                {l.group.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

async function createVoucherWrapper(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await createVoucher(prevState, formData);
  return result as FormState;
}

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
        ["debtor", "creditor", "cash", "bank"].some((k) =>
          l.group.name.toLowerCase().includes(k)
        )
      ),
    [ledgers]
  );
  const accountLedgersImpl = useMemo(
    () =>
      ledgers.filter((l) =>
        l.group.name.toLowerCase().includes(type.toLowerCase())
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

  // ✅ RESTORED CALCULATION LOGIC
  const updateRow = (
    index: number,
    field: keyof VoucherRow,
    value: string | number
  ) => {
    const newRows = [...rows];

    // Update the field
    (newRows[index] as any)[field] = value;

    // Fetch GST if Item changes
    if (field === "itemId") {
      const item = items.find((i) => i.id.toString() === value);
      newRows[index].gst = item?.gstRate || 0;
    }

    // Recalculate Row Total
    const q = parseFloat(newRows[index].qty.toString()) || 0;
    const r = parseFloat(newRows[index].rate.toString()) || 0;
    const g = newRows[index].gst || 0;

    const rowBaseAmount = q * r;
    newRows[index].amount = rowBaseAmount;
    newRows[index].taxAmount = rowBaseAmount * (g / 100);

    setRows(newRows);
  };

  const totalBaseAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalTaxAmount = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = totalBaseAmount + (enableTax ? totalTaxAmount : 0);

  if (state?.success && state?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-green-50 border-2 border-dashed border-green-200 rounded-2xl shadow-md">
        <CheckCircle size={48} className="text-green-600 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {type} Created
        </h2>
        <p className="text-slate-500 mb-8 font-mono font-bold">
          Voucher No: {state.code}
        </p>
        <div className="flex gap-4">
          <Link
            href={`/companies/${companyId}/vouchers/${state.id}/print`}
            target="_blank"
            className="bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Printer size={18} /> Print
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Create New
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

      {/* Basic Inputs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md mb-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Date
          </label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-10 border rounded px-2 text-sm"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-blue-600 uppercase">
            Voucher No
          </label>
          <input
            name="voucherNo"
            type="text"
            placeholder="Manual No"
            className="w-full h-10 border-2 border-blue-100 bg-blue-50/30 rounded px-2 font-bold focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Ref/Bill No
          </label>
          <input
            name="reference"
            type="text"
            placeholder="Bill No"
            className="w-full h-10 border rounded px-2"
          />
        </div>

        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label="Party Account"
            name="partyLedgerId"
            options={partyLedgersImpl}
            selectedId={partyId}
            setSelectedId={setPartyId}
            isRequired={true}
            placeholder="Search Party..."
          />
        </div>

        <div className="md:col-span-3">
          <SearchableLedgerSelect
            label={`${type} Account`}
            name="salesPurchaseLedgerId"
            options={accountLedgersImpl}
            selectedId={accountId}
            setSelectedId={setAccountId}
            isRequired={true}
            placeholder={`Search ${type} Ledger...`}
          />
        </div>
      </div>

      {/* Tax Selection */}
      <div className="mb-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEnableTax(!enableTax)}
          className={`px-4 py-2 rounded border text-[10px] font-bold uppercase ${
            enableTax
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-slate-50"
          }`}
        >
          {enableTax ? "Tax Enabled" : "Enable Tax"}
        </button>
        {enableTax && (
          <select
            value={taxLedgerId}
            onChange={(e) => setTaxLedgerId(e.target.value)}
            className="h-10 border rounded px-2 text-xs"
          >
            <option value="">Select Tax Ledger</option>
            {taxLedgersImpl.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-md">
        <div className="grid grid-cols-12 bg-slate-800 text-white p-2 text-[10px] uppercase font-bold">
          <div className="col-span-5 pl-2">Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right pr-4">Total</div>
        </div>
        <div className="divide-y max-h-[300px] overflow-y-auto">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 p-2 items-center gap-2">
              <select
                className="col-span-5 h-8 border rounded text-[11px] font-semibold"
                value={row.itemId}
                onChange={(e) => updateRow(idx, "itemId", e.target.value)}
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="any"
                className="col-span-2 h-8 border rounded text-right px-2 text-sm font-mono"
                value={row.qty}
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
                placeholder="0"
              />

              <input
                type="number"
                step="any"
                className="col-span-2 h-8 border rounded text-right px-2 text-sm font-mono"
                value={row.rate}
                onChange={(e) => updateRow(idx, "rate", e.target.value)}
                placeholder="0.00"
              />

              <div className="col-span-3 text-right pr-4 font-mono font-bold text-slate-700 text-sm">
                {formatCurrency(row.amount)}
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
          className="p-2 text-xs font-bold bg-slate-50 border-t hover:bg-slate-100 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Row
        </button>
      </div>

      {/* Totals Section */}
      <div className="mt-4 flex justify-between items-start gap-6">
        <textarea
          name="narration"
          placeholder="Enter Narration..."
          className="border rounded-xl p-3 text-xs w-1/2 h-20 shadow-inner outline-none focus:border-blue-400"
        />

        <div className="bg-slate-900 text-white p-4 rounded-xl w-80 shadow-xl">
          <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-400 uppercase tracking-wider">
            <span>Subtotal (Taxable)</span>
            <span className="font-mono text-white text-sm">
              {formatCurrency(totalBaseAmount)}
            </span>
          </div>

          {enableTax && (
            <div className="flex justify-between text-[11px] mb-2 border-b border-white/10 pb-2 font-medium text-slate-400 uppercase tracking-wider">
              <span>GST Amount</span>
              <span className="font-mono text-white text-sm">
                {formatCurrency(totalTaxAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center font-bold pt-1">
            <span className="text-xs uppercase text-blue-400">Grand Total</span>
            <span className="text-2xl text-yellow-400 font-mono leading-none">
              <span className="text-sm mr-1">₹</span>
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending || grandTotal < 0.01 || !partyId || !accountId}
          className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          SAVE INVOICE
        </button>
      </div>
    </form>
  );
}
