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
  AlertCircle,
} from "lucide-react";
// ✅ Import from masters.ts
import { createStockJournal } from "@/app/actions/masters";

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
    <form action={action} className="font-sans relative space-y-6">
      {isFetching && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
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
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle size={20} className="shrink-0" />
          <span className="text-sm font-bold">{state.message}</span>
        </div>
      )}

      {state?.error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-bold">{state.error}</span>
        </div>
      )}

      {/* Date & Narration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-white px-4 py-2 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <Calendar size={18} className="text-slate-400" />
          <div className="flex-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
              Transfer Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 cursor-pointer"
            />
          </div>
        </div>
        <div className="md:col-span-8">
          <textarea
            name="narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Enter stock transfer details or remarks..."
            className="w-full h-[58px] px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- CONSUMPTION (Source / Out) --- */}
        <div className="border border-orange-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-orange-50/80 px-4 py-3 flex justify-between items-center border-b border-orange-100">
            <span className="text-orange-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <div className="p-1 bg-orange-100 rounded text-orange-600">
                <TrendingDown size={14} />
              </div>
              Source (Consumption)
            </span>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                ])
              }
              className="bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 p-1.5 rounded-lg transition-colors shadow-sm"
              title="Add Item"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 bg-slate-50/30">
            {consumption.map((item) => (
              <div
                key={item.tempId}
                className="flex gap-3 items-center group bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors"
              >
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
                  className="flex-1 text-xs h-9 bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Select Item...</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>

                <div className="w-px h-6 bg-slate-100"></div>

                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty || ""}
                  className="w-16 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono font-medium text-right outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all placeholder:text-slate-300"
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
                  className="w-20 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono font-medium text-right outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all placeholder:text-slate-300"
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
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-orange-50 px-4 py-3 text-right border-t border-orange-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              Total Input Cost
            </span>
            <span className="font-mono font-bold text-orange-700 text-sm">
              ₹{totals.consTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* --- PRODUCTION (Destination / In) --- */}
        <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-emerald-50/80 px-4 py-3 flex justify-between items-center border-b border-emerald-100">
            <span className="text-emerald-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <div className="p-1 bg-emerald-100 rounded text-emerald-600">
                <TrendingUp size={14} />
              </div>
              Destination (Production)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-sm"
                title="Auto-calculate Rate based on Cost"
              >
                <Zap size={12} className="fill-current" /> Auto Rate
              </button>
              <button
                type="button"
                onClick={() =>
                  setProduction([
                    ...production,
                    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                  ])
                }
                className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3 flex-1 bg-slate-50/30">
            {production.map((item) => (
              <div
                key={item.tempId}
                className="flex gap-3 items-center group bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors"
              >
                <select
                  value={item.sid}
                  onChange={(e) =>
                    handleProductionChange(item.tempId, e.target.value)
                  }
                  className="flex-1 text-xs h-9 bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Select Item...</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>

                <div className="w-px h-6 bg-slate-100"></div>

                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty || ""}
                  className="w-16 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono font-medium text-right outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-slate-300"
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
                  className="w-20 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono font-medium text-right outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-slate-300"
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
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 px-4 py-3 text-right border-t border-emerald-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Total Output Value
            </span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              ₹{totals.prodTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-6 flex justify-end border-t border-slate-100">
        <button
          disabled={isPending}
          type="submit"
          className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 hover:-translate-y-0.5"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Post Stock Journal
        </button>
      </div>
    </form>
  );
}
