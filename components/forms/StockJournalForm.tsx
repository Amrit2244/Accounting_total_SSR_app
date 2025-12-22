"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useActionState } from "react"; // React 19 Hook
import {
  Plus,
  Trash2,
  Calendar,
  Save,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
  CheckCircle,
} from "lucide-react";
// ✅ Import from masters.ts
import { createStockJournal } from "@/app/actions/masters";
// Remove getRecipeByItem if not implemented yet, or ensure it exists
// import { getRecipeByItem } from "@/app/actions/bom";

interface JournalState {
  success?: boolean;
  message?: string;
  error?: string;
}

const initialState: JournalState = { success: false };

async function createStockJournalWrapper(
  prevState: JournalState,
  formData: FormData
): Promise<JournalState> {
  const result = await createStockJournal(prevState, formData);
  return result as JournalState;
}

export default function StockJournalForm({
  companyId,
  stockItems,
}: {
  companyId: number;
  stockItems: any[];
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isFetching, startTransition] = useTransition();
  const [narration, setNarration] = useState("");

  const [consumption, setConsumption] = useState<any[]>([
    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
  ]);
  const [production, setProduction] = useState<any[]>([
    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
  ]);

  const [state, action, isPending] = useActionState(
    createStockJournalWrapper,
    initialState
  );

  // --- Helper Functions ---
  const removeItem = (type: "cons" | "prod", tempId: number) => {
    if (type === "cons")
      setConsumption(consumption.filter((i) => i.tempId !== tempId));
    else setProduction(production.filter((i) => i.tempId !== tempId));
  };

  const handleProductionChange = (tempId: number, sid: string) => {
    setProduction(
      production.map((p) => (p.tempId === tempId ? { ...p, sid } : p))
    );

    // Example: Auto-fill consumption if BOM exists (Commented out until BOM action is ready)
    /* if (!sid) return;
    startTransition(async () => {
      const bom = await getRecipeByItem(Number(sid));
      if (bom?.components) {
        setConsumption(bom.components.map((c: any) => ({
           tempId: Math.random(),
           sid: c.stockItemId.toString(),
           qty: c.quantity,
           rate: 0
        })));
      }
    });
    */
  };

  const totals = useMemo(() => {
    const consTotal = consumption.reduce(
      (sum, i) => sum + Number(i.qty) * Number(i.rate),
      0
    );
    const prodTotal = production.reduce(
      (sum, i) => sum + Number(i.qty) * Number(i.rate),
      0
    );
    const totalProdQty = production.reduce((sum, i) => sum + Number(i.qty), 0);
    return { consTotal, prodTotal, totalProdQty };
  }, [consumption, production]);

  const applySuggestedRate = () => {
    if (totals.totalProdQty > 0) {
      const rate = (totals.consTotal / totals.totalProdQty).toFixed(2);
      setProduction(production.map((i) => ({ ...i, rate })));
    }
  };

  return (
    <form action={action} className="font-sans relative space-y-4">
      {isFetching && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="date" value={date} />
      <input
        type="hidden"
        name="consumption"
        value={JSON.stringify(consumption.filter((i) => i.sid))}
      />
      <input
        type="hidden"
        name="production"
        value={JSON.stringify(production.filter((i) => i.sid))}
      />

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle size={18} /> {state.message}
        </div>
      )}

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center shadow-sm">
          {state.error}
        </div>
      )}

      {/* Date & Narration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 border rounded-xl flex items-center gap-4 shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full bg-transparent outline-none text-sm font-bold text-slate-700"
          />
        </div>
        <input
          name="narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Narration (Optional)"
          className="h-[54px] w-full px-4 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- CONSUMPTION (Source / Out) --- */}
        <div className="border border-orange-100 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-orange-50 p-3 flex justify-between items-center text-orange-800 font-bold text-[10px] uppercase tracking-wider border-b border-orange-100">
            <span>
              <TrendingDown size={14} className="inline mr-1" /> Source
              (Consumption)
            </span>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                ])
              }
              className="bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 p-1.5 rounded-lg transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="p-3 space-y-2 flex-1">
            {consumption.map((item) => (
              <div key={item.tempId} className="flex gap-2 items-center group">
                <select
                  value={item.sid}
                  onChange={(e) =>
                    setConsumption(
                      consumption.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, sid: e.target.value }
                          : i
                      )
                    )
                  }
                  className="flex-1 text-[11px] h-8 border border-slate-200 rounded-lg px-2 outline-none focus:border-orange-400"
                >
                  <option value="">Select Item</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty || ""}
                  className="w-16 h-8 border border-slate-200 rounded-lg px-2 text-[11px] text-right outline-none focus:border-orange-400"
                  onChange={(e) =>
                    setConsumption(
                      consumption.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, qty: e.target.value }
                          : i
                      )
                    )
                  }
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate || ""}
                  className="w-16 h-8 border border-slate-200 rounded-lg px-2 text-[11px] text-right outline-none focus:border-orange-400"
                  onChange={(e) =>
                    setConsumption(
                      consumption.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, rate: e.target.value }
                          : i
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => removeItem("cons", item.tempId)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-orange-50/50 p-2 text-right text-[10px] font-bold text-orange-800 border-t border-orange-100">
            Total Cost: ₹{totals.consTotal.toLocaleString()}
          </div>
        </div>

        {/* --- PRODUCTION (Destination / In) --- */}
        <div className="border border-emerald-100 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-emerald-50 p-3 flex justify-between items-center text-emerald-800 font-bold text-[10px] uppercase tracking-wider border-b border-emerald-100">
            <span>
              <TrendingUp size={14} className="inline mr-1" /> Destination
              (Production)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-[9px] flex items-center gap-1 transition-colors"
                title="Auto-calculate Rate based on Cost"
              >
                <Zap size={10} /> Auto Rate
              </button>
              <button
                type="button"
                onClick={() =>
                  setProduction([
                    ...production,
                    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                  ])
                }
                className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2 flex-1">
            {production.map((item) => (
              <div key={item.tempId} className="flex gap-2 items-center group">
                <select
                  value={item.sid}
                  onChange={(e) =>
                    handleProductionChange(item.tempId, e.target.value)
                  }
                  className="flex-1 text-[11px] h-8 border border-slate-200 rounded-lg px-2 outline-none focus:border-emerald-400"
                >
                  <option value="">Select Item</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty || ""}
                  className="w-16 h-8 border border-slate-200 rounded-lg px-2 text-[11px] text-right outline-none focus:border-emerald-400"
                  onChange={(e) =>
                    setProduction(
                      production.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, qty: e.target.value }
                          : i
                      )
                    )
                  }
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate || ""}
                  className="w-16 h-8 border border-slate-200 rounded-lg px-2 text-[11px] text-right outline-none focus:border-emerald-400"
                  onChange={(e) =>
                    setProduction(
                      production.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, rate: e.target.value }
                          : i
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => removeItem("prod", item.tempId)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50/50 p-2 text-right text-[10px] font-bold text-emerald-800 border-t border-emerald-100">
            Total Value: ₹{totals.prodTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-4 flex justify-end">
        <button
          disabled={isPending}
          type="submit"
          className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Post Stock Journal
        </button>
      </div>
    </form>
  );
}
