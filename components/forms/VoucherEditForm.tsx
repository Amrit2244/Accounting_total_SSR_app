"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useActionState } from "react";
import {
  Save,
  Loader2,
  ListPlus,
  Trash2,
  CheckCircle,
  ShieldAlert,
  Calendar,
  Tag,
  Package,
  ArrowRightCircle,
  Info,
} from "lucide-react";
import { updateVoucher } from "@/app/actions/masters";

// ✅ FIX 1: State Interface
interface VoucherUpdateState {
  success: boolean;
  message?: string;
  errors?: any;
}

// ✅ FIX 2: Initial State
const initialState: VoucherUpdateState = {
  success: false,
  message: "",
};

// ✅ FIX 3: Typed Wrapper
async function updateVoucherWrapper(
  prevState: VoucherUpdateState,
  formData: FormData
): Promise<VoucherUpdateState> {
  const result = await updateVoucher(prevState, formData);
  return result as VoucherUpdateState;
}

export default function VoucherEditForm({
  companyId,
  voucher,
  ledgers,
  stockItems,
}: any) {
  const initialData = useMemo(
    () => ({
      date: new Date(voucher.date).toISOString().split("T")[0],
      narration: voucher.narration || "",
      entriesJson: JSON.stringify(
        (voucher.entries || [])
          .map((e: any) => ({
            lid: e.ledgerId,
            amt: Number(e.amount).toFixed(2),
          }))
          .sort((a: any, b: any) => a.lid - b.lid)
      ),
      inventoryJson: JSON.stringify(
        (voucher.inventory || [])
          .map((i: any) => ({
            siid: i.stockItemId,
            qty: Number(i.quantity).toFixed(2),
            rate: Number(i.rate).toFixed(2),
          }))
          .sort((a: any, b: any) => a.siid - b.siid)
      ),
    }),
    [voucher]
  );

  const [date, setDate] = useState(initialData.date);
  const [narration, setNarration] = useState(initialData.narration);
  const [entries, setEntries] = useState(
    voucher.entries.map((e: any) => ({ ...e, tempId: e.id || Math.random() }))
  );
  const [inventory, setInventory] = useState(
    (voucher.inventory || []).map((i: any) => ({
      ...i,
      tempId: i.id || Math.random(),
    }))
  );

  // ✅ FIX 4: Connected to Wrapper
  const [state, action, isPending] = useActionState(
    updateVoucherWrapper,
    initialState
  );

  useEffect(() => {
    const isSalesOrPurchase =
      voucher.type?.toUpperCase().includes("SALE") ||
      voucher.type?.toUpperCase().includes("PURCHASE");
    if (isSalesOrPurchase) {
      const totalInvValue = inventory.reduce(
        (sum: number, item: any) =>
          sum + Number(item.quantity || 0) * Number(item.rate || 0),
        0
      );
      setEntries((prevEntries: any) =>
        prevEntries.map((ent: any) => {
          if (ent.amount > 0) return { ...ent, amount: totalInvValue };
          if (ent.amount < 0) return { ...ent, amount: -totalInvValue };
          return ent;
        })
      );
    }
  }, [inventory, voucher.type]);

  const { totalDebit, totalCredit, currentEntriesJson, currentInventoryJson } =
    useMemo(() => {
      const d = entries.reduce(
        (s: number, e: any) => s + (e.amount > 0 ? Number(e.amount) : 0),
        0
      );
      const c = entries.reduce(
        (s: number, e: any) =>
          s + (e.amount < 0 ? Math.abs(Number(e.amount)) : 0),
        0
      );
      const validEntries = entries
        .filter((e: any) => e.ledgerId && Math.abs(Number(e.amount)) > 0)
        .map((e: any) => ({
          ledgerId: Number(e.ledgerId),
          amount: Number(e.amount),
        }))
        .sort((a: any, b: any) => a.ledgerId - b.ledgerId);
      const validInv = inventory
        .filter((i: any) => i.stockItemId && Number(i.quantity) > 0)
        .map((i: any) => ({
          stockItemId: Number(i.stockItemId),
          quantity: Number(i.quantity),
          rate: Number(i.rate),
        }))
        .sort((a: any, b: any) => a.stockItemId - b.stockItemId);

      return {
        totalDebit: Math.round(d * 100) / 100,
        totalCredit: Math.round(c * 100) / 100,
        currentEntriesJson: JSON.stringify(validEntries),
        currentInventoryJson: JSON.stringify(validInv),
      };
    }, [entries, inventory]);

  const isBalanced =
    Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const hasChanged =
    date !== initialData.date ||
    narration !== initialData.narration ||
    currentEntriesJson !== initialData.entriesJson ||
    currentInventoryJson !== initialData.inventoryJson;
  const isSalesOrPurchase =
    voucher.type?.toUpperCase().includes("SALE") ||
    voucher.type?.toUpperCase().includes("PURCHASE");

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="voucherId" value={voucher.id} />
      <input
        type="hidden"
        name="structuredEntries"
        value={currentEntriesJson}
      />
      <input
        type="hidden"
        name="structuredInventory"
        value={currentInventoryJson}
      />

      {state?.success && state.message?.includes("Ref:") && (
        <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner">
              <CheckCircle size={48} />
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">
                Modification Saved
              </h2>
              <p className="text-emerald-50 text-xl font-medium opacity-90 mt-2">
                {state.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {state?.success && state.message?.includes("No changes detected") && (
        <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white flex items-center gap-6 shadow-xl animate-in fade-in">
          <Info size={40} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              No Changes Necessary
            </h2>
            <p className="opacity-90 font-medium">
              The voucher is already identical to the current data.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" /> Posting Date
          </label>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Tag size={14} className="text-blue-500" /> Voucher Type
          </label>
          <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 font-black uppercase flex items-center justify-between">
            <span>{voucher.type}</span>{" "}
            <span className="text-blue-600 opacity-50">
              #{voucher.voucherNo}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ShieldAlert size={14} className="text-blue-500" /> Status
          </label>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 font-black text-center text-sm tracking-widest uppercase">
            {voucher.status}
          </div>
        </div>
      </div>

      {isSalesOrPurchase && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Package size={22} className="text-blue-600" /> Inventory Items
            </h3>
            <button
              type="button"
              onClick={() =>
                setInventory([
                  ...inventory,
                  {
                    tempId: Math.random(),
                    stockItemId: "",
                    quantity: 0,
                    rate: 0,
                  },
                ])
              }
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg"
            >
              <ListPlus size={16} /> Add Row
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {inventory.map((item: any) => (
                <tr
                  key={item.tempId}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-3 px-8">
                    <select
                      value={item.stockItemId || ""}
                      onChange={(e) =>
                        setInventory(
                          inventory.map((i: any) =>
                            i.tempId === item.tempId
                              ? { ...i, stockItemId: e.target.value }
                              : i
                          )
                        )
                      }
                      className="w-full p-2 bg-transparent border-none focus:ring-0 font-bold text-slate-800 text-lg"
                    >
                      <option value="">Select Item...</option>
                      {stockItems?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        setInventory(
                          inventory.map((i: any) =>
                            i.tempId === item.tempId
                              ? { ...i, quantity: e.target.value }
                              : i
                          )
                        )
                      }
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-black text-blue-600 text-xl"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.rate || ""}
                      onChange={(e) =>
                        setInventory(
                          inventory.map((i: any) =>
                            i.tempId === item.tempId
                              ? { ...i, rate: e.target.value }
                              : i
                          )
                        )
                      }
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-bold text-slate-600 text-lg"
                    />
                  </td>
                  <td className="p-3 text-right font-mono text-slate-900 font-black text-lg pr-8">
                    {(
                      Number(item.quantity || 0) * Number(item.rate || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <Trash2
                      size={20}
                      className="text-slate-300 hover:text-red-500 cursor-pointer"
                      onClick={() =>
                        setInventory(
                          inventory.filter((i: any) => i.tempId !== item.tempId)
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 text-lg font-black text-slate-800 tracking-tight">
          Ledger Distribution
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-50">
            {entries.map((entry: any) => (
              <tr
                key={entry.tempId}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-3 px-8">
                  <select
                    value={entry.ledgerId || ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? { ...ent, ledgerId: parseInt(e.target.value) }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 border-none bg-transparent font-bold text-slate-800"
                  >
                    <option value="">Select Ledger...</option>
                    {ledgers.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 px-8">
                  <input
                    type="number"
                    value={entry.amount > 0 ? entry.amount : ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? {
                                ...ent,
                                amount: parseFloat(e.target.value) || 0,
                              }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 text-right bg-transparent font-black text-red-600 text-lg outline-none"
                  />
                </td>
                <td className="p-3 px-8">
                  <input
                    type="number"
                    value={entry.amount < 0 ? Math.abs(entry.amount) : ""}
                    onChange={(e) =>
                      setEntries(
                        entries.map((ent: any) =>
                          ent.tempId === entry.tempId
                            ? {
                                ...ent,
                                amount: -(parseFloat(e.target.value) || 0),
                              }
                            : ent
                        )
                      )
                    }
                    className="w-full p-2 text-right bg-transparent font-black text-emerald-600 text-lg outline-none"
                  />
                </td>
                <td className="p-3 text-center">
                  <Trash2
                    size={20}
                    className="text-slate-300 hover:text-red-500 cursor-pointer"
                    onClick={() =>
                      setEntries(
                        entries.filter((e: any) => e.tempId !== entry.tempId)
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold">
            <tr>
              <td className="p-6 px-8">
                <button
                  type="button"
                  onClick={() =>
                    setEntries([
                      ...entries,
                      { tempId: Math.random(), ledgerId: null, amount: 0 },
                    ])
                  }
                  className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-white"
                >
                  <ListPlus size={16} /> Add Split Row
                </button>
              </td>
              <td
                className={`p-6 text-right font-mono text-2xl ${
                  !isBalanced ? "text-red-400" : "text-white"
                }`}
              >
                {totalDebit.toFixed(2)}
              </td>
              <td
                className={`p-6 text-right font-mono text-2xl ${
                  !isBalanced ? "text-red-400" : "text-white"
                }`}
              >
                {totalCredit.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
          Audit Note
        </label>
        <textarea
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          name="narration"
          rows={3}
          className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] outline-none shadow-sm font-bold text-slate-600 text-lg"
          placeholder="Reason for change..."
        />
      </div>

      <button
        disabled={isPending || !isBalanced || !hasChanged}
        type="submit"
        className={`w-full py-6 rounded-[2rem] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-4 transition-all text-lg shadow-2xl ${
          !isBalanced || !hasChanged
            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
            : "bg-slate-900 text-white hover:bg-black hover:-translate-y-1"
        }`}
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <ArrowRightCircle size={24} />
        )}
        {!hasChanged
          ? "No Edits Found"
          : !isBalanced
          ? "Unbalanced Entries"
          : "Authorize & Commit Edits"}
      </button>
    </form>
  );
}
