"use client";

import React, { useState, useMemo } from "react";
import { useActionState } from "react";
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
} from "lucide-react";
import { createStockJournal } from "@/app/actions/inventory";

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

  const totals = useMemo(() => {
    const consTotal = consumption.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.rate),
      0
    );
    const prodTotal = production.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.rate),
      0
    );
    return { consTotal, prodTotal };
  }, [consumption, production]);

  return (
    <form action={action} className="space-y-8">
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

      {/* ✅ MAKER-CHECKER SUCCESS MESSAGE */}
      {state?.success && (
        <div className="relative overflow-hidden bg-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
              <ShieldEllipsis size={40} className="text-white" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight uppercase">
                Sent for Verification
              </h2>
              <p className="text-amber-50 text-lg font-medium opacity-90 mt-1">
                {state.message}
              </p>
            </div>
            <div className="md:ml-auto">
              <div className="px-6 py-3 bg-white text-amber-700 rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg">
                Status: Pending
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      )}

      {state?.error && (
        <div className="p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-[2rem] flex items-center gap-4">
          <AlertCircle size={32} />
          <p className="font-bold text-lg">{state.error}</p>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" /> Journal Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ArrowRightLeft size={14} className="text-blue-500" /> Voucher Type
          </label>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 font-black uppercase tracking-widest text-center">
            Stock Journal (Manufacturing)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Consumption Side */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50 px-8 py-6 border-b border-orange-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-orange-800 tracking-tight flex items-center gap-3">
              <TrendingDown size={22} /> Consumption (Source)
            </h3>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", name: "", qty: 0, rate: 0 },
                ])
              }
              className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {consumption.map((item) => (
                <tr key={item.tempId} className="hover:bg-slate-50/50">
                  <td className="p-3 px-8">
                    <select
                      value={item.sid}
                      onChange={(e) => {
                        const selected = stockItems.find(
                          (si) => si.id === Number(e.target.value)
                        );
                        setConsumption(
                          consumption.map((i) =>
                            i.tempId === item.tempId
                              ? {
                                  ...i,
                                  sid: e.target.value,
                                  name: selected?.name,
                                }
                              : i
                          )
                        );
                      }}
                      className="w-full p-2 bg-transparent border-none focus:ring-0 font-bold text-slate-800"
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
                        setConsumption(
                          consumption.map((i) =>
                            i.tempId === item.tempId
                              ? { ...i, qty: e.target.value }
                              : i
                          )
                        )
                      }
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-black text-orange-600"
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
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-bold text-slate-600"
                    />
                  </td>
                  <td className="p-3 px-8 text-center">
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
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-slate-50 border-t flex justify-between items-center px-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Consumption
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{totals.consTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Production Side */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 px-8 py-6 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-emerald-800 tracking-tight flex items-center gap-3">
              <TrendingUp size={22} /> Production (Destination)
            </h3>
            <button
              type="button"
              onClick={() =>
                setProduction([
                  ...production,
                  { tempId: Math.random(), sid: "", name: "", qty: 0, rate: 0 },
                ])
              }
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {production.map((item) => (
                <tr key={item.tempId} className="hover:bg-slate-50/50">
                  <td className="p-3 px-8">
                    <select
                      value={item.sid}
                      onChange={(e) => {
                        const selected = stockItems.find(
                          (si) => si.id === Number(e.target.value)
                        );
                        setProduction(
                          production.map((i) =>
                            i.tempId === item.tempId
                              ? {
                                  ...i,
                                  sid: e.target.value,
                                  name: selected?.name,
                                }
                              : i
                          )
                        );
                      }}
                      className="w-full p-2 bg-transparent border-none focus:ring-0 font-bold text-slate-800"
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
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-black text-emerald-600"
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
                      className="w-full p-2 text-right bg-transparent outline-none font-mono font-bold text-slate-600"
                    />
                  </td>
                  <td className="p-3 px-8 text-center">
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Production
            </span>
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
        className={`w-full py-6 rounded-[2rem] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-4 transition-all text-lg shadow-2xl ${
          isPending
            ? "bg-slate-100 text-slate-300"
            : "bg-slate-900 text-white hover:bg-black"
        }`}
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <Save size={24} />
        )}
        Submit for Verification
      </button>
    </form>
  );
}
