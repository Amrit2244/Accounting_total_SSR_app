"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useActionState } from "react";
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
  ShieldCheck, // New Icon for Admin
  Clock,
} from "lucide-react";
import { createStockJournal } from "@/app/actions/masters";

interface JournalState {
  success?: boolean;
  message?: string;
  error?: string;
  txid?: string;
}

const initialState: JournalState = { success: false };

export default function StockJournalForm({
  companyId,
  stockItems,
  isAdmin = false, // New prop passed from parent
}: {
  companyId: number;
  stockItems: any[];
  isAdmin?: boolean;
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

  async function createStockJournalWrapper(
    prevState: JournalState,
    formData: FormData
  ): Promise<JournalState> {
    const result = await createStockJournal(prevState, formData);
    return result as JournalState;
  }

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

  // --- SUCCESS VIEW ---
  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div
          className={`absolute top-0 inset-x-0 h-2 ${
            isAdmin ? "bg-indigo-600" : "bg-emerald-600"
          }`}
        />
        <div
          className={`${
            isAdmin
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600"
          } p-6 rounded-full mb-6 shadow-sm border border-slate-100`}
        >
          {isAdmin ? (
            <ShieldCheck size={48} strokeWidth={1.5} />
          ) : (
            <CheckCircle size={48} strokeWidth={1.5} />
          )}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {isAdmin ? "Journal Authorized" : "Journal Submitted"}
        </h2>
        <div
          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8 ${
            isAdmin
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isAdmin ? <CheckCircle size={12} /> : <Clock size={12} />}
          Status: {isAdmin ? "Success (Auto-Verified)" : "Pending Verification"}
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full max-w-sm mb-8 text-left shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Audit TXID
            </span>
            <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded border">
              {state.txid || "---"}
            </span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={`px-10 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
            isAdmin
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-slate-900 hover:bg-indigo-600 text-white"
          }`}
        >
          Create New Entry
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="font-sans relative space-y-6">
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

      {state?.error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-bold">{state.error}</span>
        </div>
      )}

      {/* Date & Narration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div
          className={`md:col-span-4 bg-white px-4 py-2 border rounded-xl flex items-center gap-3 shadow-sm transition-all focus-within:ring-2 ${
            isAdmin
              ? "focus-within:ring-indigo-500 border-indigo-100"
              : "focus-within:ring-blue-500 border-slate-200"
          }`}
        >
          <Calendar
            size={18}
            className={isAdmin ? "text-indigo-400" : "text-slate-400"}
          />
          <div className="flex-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
              Transfer Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-900"
            />
          </div>
        </div>
        <div className="md:col-span-8">
          <textarea
            name="narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Enter details..."
            className="w-full h-[58px] px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- CONSUMPTION --- */}
        <div className="border border-orange-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-orange-50/80 px-4 py-3 flex justify-between items-center border-b border-orange-100">
            <span className="text-orange-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <TrendingDown size={14} /> Source (Consumption)
            </span>
            <button
              type="button"
              onClick={() =>
                setConsumption([
                  ...consumption,
                  { tempId: Math.random(), sid: "", qty: 0, rate: 0 },
                ])
              }
              className="bg-white text-orange-700 border border-orange-200 p-1.5 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3 flex-1 bg-slate-50/30">
            {consumption.map((item, idx) => (
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
                  className="flex-1 text-xs h-9 bg-transparent font-bold text-slate-700 outline-none"
                >
                  <option value="">Select Item...</option>
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
                  className="w-16 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono text-right outline-none"
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
                  className="w-20 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono text-right outline-none"
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
                  className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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

        {/* --- PRODUCTION --- */}
        <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-emerald-50/80 px-4 py-3 flex justify-between items-center border-b border-emerald-100">
            <span className="text-emerald-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Destination (Production)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedRate}
                className="bg-white text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1.5 hover:bg-emerald-50 transition-all shadow-sm"
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
                className="bg-white text-emerald-700 border border-emerald-200 p-1.5 rounded-lg hover:bg-emerald-50"
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
                    setProduction(
                      production.map((p) =>
                        p.tempId === item.tempId
                          ? { ...p, sid: e.target.value }
                          : p
                      )
                    )
                  }
                  className="flex-1 text-xs h-9 bg-transparent font-bold text-slate-700 outline-none"
                >
                  <option value="">Select Item...</option>
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
                  className="w-16 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono text-right outline-none"
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
                  className="w-20 h-8 bg-slate-50 rounded-lg px-2 text-xs font-mono text-right outline-none"
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
                  className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
          className={`h-12 px-10 rounded-xl font-black uppercase text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 hover:-translate-y-0.5
            ${
              isAdmin
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                : "bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-900/20"
            }
          `}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isAdmin ? (
            <ShieldCheck size={18} />
          ) : (
            <Save size={18} />
          )}
          {isAdmin ? "Post & Authorize Instantly" : "Post Stock Journal"}
        </button>
      </div>
    </form>
  );
}
