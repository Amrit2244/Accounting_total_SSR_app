"use client";

import React, { useState, useMemo, useActionState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Package,
  ArrowRightLeft,
  Calendar,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ShieldEllipsis,
  Zap,
} from "lucide-react";
import { createStockJournal } from "@/app/actions/inventory";
import { getRecipeByItem } from "@/app/actions/bom"; // ✅ Import the new action

interface StockItem {
  id: number;
  name: string;
  quantity: number;
}

export default function StockJournalForm({
  companyId,
  stockItems,
}: {
  companyId: number;
  stockItems: StockItem[];
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [isFetching, startTransition] = useTransition(); // ✅ For Recipe Loading

  const [consumption, setConsumption] = useState<any[]>([
    { tempId: Math.random(), sid: "", name: "", qty: 0, rate: 0 },
  ]);

  const [production, setProduction] = useState<any[]>([
    { tempId: Math.random(), sid: "", name: "", qty: 0, rate: 0 },
  ]);

  const [state, action, isPending] = useActionState(
    createStockJournal as any,
    null
  );

  // --- SMART RECIPE HANDLER ---
  const handleProductionChange = (tempId: number, sid: string) => {
    const selectedItem = stockItems.find((s) => s.id === Number(sid));

    setProduction(
      production.map((p) =>
        p.tempId === tempId ? { ...p, sid, name: selectedItem?.name } : p
      )
    );

    if (!sid) return;

    // ✅ Automatically Fetch Recipe using Server Action
    startTransition(async () => {
      const bom = await getRecipeByItem(Number(sid));
      if (bom && bom.components) {
        const recipeRows = bom.components.map((c: any) => ({
          tempId: Math.random(),
          sid: c.stockItemId.toString(),
          name: c.stockItem.name,
          qty: c.quantity,
          rate: 0,
        }));
        setConsumption(recipeRows);
      }
    });
  };

  const totals = useMemo(() => {
    const consTotal = consumption.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.rate),
      0
    );
    const prodTotal = production.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.rate),
      0
    );
    const totalProdQty = production.reduce(
      (sum, item) => sum + Number(item.qty),
      0
    );
    return { consTotal, prodTotal, totalProdQty };
  }, [consumption, production]);

  const suggestedRate = useMemo(() => {
    if (totals.totalProdQty <= 0) return 0;
    return (totals.consTotal / totals.totalProdQty).toFixed(2);
  }, [totals.consTotal, totals.totalProdQty]);

  const applySuggestedRate = () => {
    setProduction(production.map((item) => ({ ...item, rate: suggestedRate })));
  };

  return (
    <form action={action} className="relative space-y-8">
      {/* Recipe Loading Overlay */}
      {isFetching && (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-[2.5rem]">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-xs font-black uppercase tracking-widest">
              Applying Recipe...
            </span>
          </div>
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
        <div className="relative overflow-hidden bg-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
              <ShieldEllipsis size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase tracking-tight">
                Sent for Verification
              </h2>
              <p className="text-amber-50 text-lg font-medium opacity-90 mt-1">
                {state.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Journal Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ArrowRightLeft size={14} /> Voucher Type
          </label>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 font-black uppercase tracking-widest text-center">
            Stock Journal (Manufacturing)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* CONSUMPTION */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50 px-8 py-6 border-b border-orange-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-orange-800 tracking-tight flex items-center gap-3">
              <TrendingDown /> Consumption
            </h3>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", name: "", qty: 0, rate: 0 },
                ])
              }
              className="p-2 bg-orange-600 text-white rounded-xl"
            >
              <Plus size={20} />
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {consumption.map((item) => {
                const masterItem = stockItems.find(
                  (si) => si.id === Number(item.sid)
                );
                const isShortage =
                  Number(item.qty) > (masterItem?.quantity || 0);
                return (
                  <tr key={item.tempId}>
                    <td className="p-3 px-8">
                      <select
                        value={item.sid}
                        onChange={(e) => {
                          const s = stockItems.find(
                            (si) => si.id === Number(e.target.value)
                          );
                          setConsumption(
                            consumption.map((i) =>
                              i.tempId === item.tempId
                                ? { ...i, sid: e.target.value, name: s?.name }
                                : i
                            )
                          );
                        }}
                        className="w-full p-2 bg-transparent font-bold"
                      >
                        <option value="">Select Item...</option>
                        {stockItems.map((si) => (
                          <option key={si.id} value={si.id}>
                            {si.name}
                          </option>
                        ))}
                      </select>
                      {item.sid && (
                        <div
                          className={`text-[9px] font-black px-2 py-0.5 rounded inline-block mt-1 ${
                            isShortage
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          Available Stock: {masterItem?.quantity || 0}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
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
                        className="w-full p-2 text-right font-mono font-black text-orange-600 outline-none"
                        placeholder="Qty"
                      />
                    </td>
                    <td className="p-3">
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
                        className="w-full p-2 text-right font-mono font-bold text-slate-600 outline-none"
                        placeholder="Rate"
                      />
                    </td>
                    <td className="p-3 px-8">
                      <Trash2
                        size={18}
                        className="text-slate-300 hover:text-red-500 cursor-pointer"
                        onClick={() =>
                          setConsumption(
                            consumption.filter((i) => i.tempId !== item.tempId)
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-6 bg-slate-50 border-t flex justify-between items-center px-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Consumption
            </span>
            <span className="text-xl font-black text-slate-900 font-mono text-slate-900">
              ₹{totals.consTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* PRODUCTION */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 px-8 py-6 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-emerald-800 tracking-tight flex items-center gap-3">
              <TrendingUp /> Production
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase"
              >
                <Zap size={14} /> Auto Rate
              </button>
              <button
                type="button"
                onClick={() =>
                  setProduction([
                    ...production,
                    {
                      tempId: Math.random(),
                      sid: "",
                      name: "",
                      qty: 0,
                      rate: 0,
                    },
                  ])
                }
                className="p-2 bg-emerald-600 text-white rounded-xl"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {production.map((item) => (
                <tr key={item.tempId}>
                  <td className="p-3 px-8">
                    <select
                      value={item.sid}
                      onChange={(e) =>
                        handleProductionChange(item.tempId, e.target.value)
                      }
                      className="w-full p-2 bg-transparent font-bold"
                    >
                      <option value="">Select Item...</option>
                      {stockItems.map((si) => (
                        <option key={si.id} value={si.id}>
                          {si.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
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
                      className="w-full p-2 text-right font-mono font-black text-emerald-600 outline-none"
                      placeholder="Qty"
                    />
                  </td>
                  <td className="p-3">
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
                      className="w-full p-2 text-right font-mono font-bold text-slate-600 outline-none"
                      placeholder="Rate"
                    />
                  </td>
                  <td className="p-3 px-8">
                    <Trash2
                      size={18}
                      className="text-slate-300 hover:text-red-500 cursor-pointer"
                      onClick={() =>
                        setProduction(
                          production.filter((i) => i.tempId !== item.tempId)
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-slate-50 border-t flex justify-between items-center px-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Production
              </span>
              {Number(suggestedRate) > 0 && (
                <span className="text-[9px] font-bold text-blue-500 italic">
                  Suggested Rate: ₹{suggestedRate}
                </span>
              )}
            </div>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{totals.prodTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
          Narration
        </label>
        <textarea
          name="narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          rows={3}
          className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] outline-none font-bold text-slate-600 text-lg"
          placeholder="Enter process details..."
        />
      </div>

      <button
        disabled={isPending}
        type="submit"
        className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest transition-all text-lg shadow-2xl ${
          isPending
            ? "bg-slate-100 text-slate-300"
            : "bg-slate-900 text-white hover:bg-black"
        }`}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Save />} Submit for
        Verification
      </button>
    </form>
  );
}
