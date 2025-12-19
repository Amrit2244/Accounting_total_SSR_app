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

interface JournalState {
  success?: boolean;
  message?: string;
  error?: string;
}

const initialState: JournalState = { success: false };

// ✅ FIX: Wrapper
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

  const handleProductionChange = (tempId: number, sid: string) => {
    setProduction(
      production.map((p) => (p.tempId === tempId ? { ...p, sid } : p))
    );
    if (!sid) return;
    startTransition(async () => {
      const bom = await getRecipeByItem(Number(sid));
      if (bom?.components) {
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
        <div className="bg-emerald-600 text-white p-4 rounded-xl text-center shadow-md">
          {state.message}
        </div>
      )}

      <div className="bg-white p-4 border rounded-xl flex items-center gap-4 shadow-sm">
        <Calendar size={14} className="text-slate-400" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 px-3 border rounded text-xs font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consumption Block */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="bg-orange-50 p-2 flex justify-between items-center text-orange-800 font-bold text-[10px] uppercase">
            <span>
              <TrendingDown size={14} className="inline mr-1" /> Consumption
              (OUT)
            </span>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                ])
              }
              className="bg-orange-600 text-white p-1 rounded"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="p-2 space-y-2">
            {consumption.map((item) => (
              <div key={item.tempId} className="flex gap-1">
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
                  className="flex-1 text-[10px] border rounded p-1"
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
                  className="w-16 border rounded p-1 text-[10px]"
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
                  className="w-16 border rounded p-1 text-[10px]"
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
              </div>
            ))}
          </div>
        </div>

        {/* Production Block */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="bg-emerald-50 p-2 flex justify-between items-center text-emerald-800 font-bold text-[10px] uppercase">
            <span>
              <TrendingUp size={14} className="inline mr-1" /> Production (IN)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="bg-blue-600 text-white px-2 rounded text-[8px]"
              >
                <Zap size={10} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setProduction([
                    ...production,
                    { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                  ])
                }
                className="bg-emerald-600 text-white p-1 rounded"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-2">
            {production.map((item) => (
              <div key={item.tempId} className="flex gap-1">
                <select
                  value={item.sid}
                  onChange={(e) =>
                    handleProductionChange(item.tempId, e.target.value)
                  }
                  className="flex-1 text-[10px] border rounded p-1"
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
                  className="w-16 border rounded p-1 text-[10px]"
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
                  className="w-16 border rounded p-1 text-[10px]"
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        disabled={isPending}
        type="submit"
        className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Save />} Post Stock
        Journal
      </button>
    </form>
  );
}
