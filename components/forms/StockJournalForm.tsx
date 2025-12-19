"use client";

import React, { useState, useMemo, useActionState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Save,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { createStockJournal } from "@/app/actions/inventory";
import { getRecipeByItem } from "@/app/actions/bom";

export default function StockJournalForm({
  companyId,
  stockItems,
}: {
  companyId: number;
  stockItems: any[];
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isFetching, startTransition] = useTransition();
  const [consumption, setConsumption] = useState<any[]>([
    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
  ]);
  const [production, setProduction] = useState<any[]>([
    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
  ]);
  const [state, action, isPending] = useActionState(
    createStockJournal as any,
    null
  );

  const handleProductionChange = (tempId: number, sid: string) => {
    setProduction(
      production.map((p) => (p.tempId === tempId ? { ...p, sid } : p))
    );
    if (!sid) return;
    startTransition(async () => {
      const bom = await getRecipeByItem(Number(sid));
      if (bom && bom.components) {
        setConsumption(
          bom.components.map((c: any) => ({
            tempId: Math.random(),
            sid: c.stockItemId.toString(),
            qty: c.quantity,
            rate: 0,
          }))
        );
      }
    });
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
        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-blue-600" />
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
        <div className="bg-emerald-600 text-white p-4 rounded-xl font-bold text-center text-sm shadow-md mb-4">
          {state.message}
        </div>
      )}

      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} /> Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CONSUMPTION */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex justify-between items-center text-orange-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <TrendingDown size={14} /> Consumption
            </h3>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                ])
              }
              className="p-1 bg-orange-600 text-white rounded"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
            {consumption.map((item) => (
              <div key={item.tempId} className="flex gap-2">
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
                  className="flex-1 h-8 px-2 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold outline-none"
                >
                  <option value="">Item...</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.qty || ""}
                  onChange={(e) =>
                    setConsumption(
                      consumption.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, qty: e.target.value }
                          : i
                      )
                    )
                  }
                  className="w-16 h-8 px-2 text-right bg-slate-50 border border-slate-100 rounded text-[10px] font-mono font-bold outline-none"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  value={item.rate || ""}
                  onChange={(e) =>
                    setConsumption(
                      consumption.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, rate: e.target.value }
                          : i
                      )
                    )
                  }
                  className="w-16 h-8 px-2 text-right bg-slate-50 border border-slate-100 rounded text-[10px] font-mono font-bold outline-none"
                  placeholder="Rate"
                />
                <button
                  type="button"
                  onClick={() =>
                    setConsumption(
                      consumption.filter((i) => i.tempId !== item.tempId)
                    )
                  }
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 bg-slate-50 text-right text-[10px] font-black text-slate-500 border-t">
            Total: {totals.consTotal.toFixed(2)}
          </div>
        </div>

        {/* PRODUCTION */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex justify-between items-center text-emerald-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Production
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold uppercase"
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
                className="p-1 bg-emerald-600 text-white rounded"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
            {production.map((item) => (
              <div key={item.tempId} className="flex gap-2">
                <select
                  value={item.sid}
                  onChange={(e) =>
                    handleProductionChange(item.tempId, e.target.value)
                  }
                  className="flex-1 h-8 px-2 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold outline-none"
                >
                  <option value="">Item...</option>
                  {stockItems.map((si) => (
                    <option key={si.id} value={si.id}>
                      {si.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.qty || ""}
                  onChange={(e) =>
                    setProduction(
                      production.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, qty: e.target.value }
                          : i
                      )
                    )
                  }
                  className="w-16 h-8 px-2 text-right bg-slate-50 border border-slate-100 rounded text-[10px] font-mono font-bold text-emerald-600 outline-none"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  value={item.rate || ""}
                  onChange={(e) =>
                    setProduction(
                      production.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, rate: e.target.value }
                          : i
                      )
                    )
                  }
                  className="w-16 h-8 px-2 text-right bg-slate-50 border border-slate-100 rounded text-[10px] font-mono font-bold outline-none"
                  placeholder="Rate"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProduction(
                      production.filter((i) => i.tempId !== item.tempId)
                    )
                  }
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 bg-slate-50 text-right text-[10px] font-black text-slate-500 border-t">
            Total: {totals.prodTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <button
        disabled={isPending}
        type="submit"
        className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Save size={16} />
        )}{" "}
        Post Journal
      </button>
    </form>
  );
}
