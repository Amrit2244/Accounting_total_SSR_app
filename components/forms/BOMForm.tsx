"use client";

import React, { useState, useActionState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Beaker,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { createBOM } from "@/app/actions/bom";

// 1. Define State Interface
interface BOMState {
  success?: boolean;
  message?: string;
  error?: string;
}

// 2. Wrapper to handle arguments and return type
async function createBOMWrapper(prevState: any, formData: FormData) {
  const result = await createBOM(prevState, formData);
  return result as BOMState;
}

// 3. Initial State
const initialState: BOMState = {
  success: false,
  message: "",
  error: "",
};

export default function BOMForm({
  companyId,
  stockItems,
}: {
  companyId: number;
  stockItems: any[];
}) {
  const [components, setComponents] = useState<any[]>([
    { stockItemId: "", quantity: 1 },
  ]);

  // 4. Use wrapper and initial state
  const [state, action, isPending] = useActionState(
    createBOMWrapper,
    initialState
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
      {/* Decorative Strip */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

      <div className="p-6 md:p-8">
        <form action={action} className="space-y-8 font-sans">
          <input type="hidden" name="companyId" value={companyId} />
          <input
            type="hidden"
            name="components"
            value={JSON.stringify(components.filter((c) => c.stockItemId))}
          />

          {/* STATUS MESSAGES */}
          {state?.error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} /> {state.error}
            </div>
          )}
          {state?.success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle size={16} /> {state.message}
            </div>
          )}

          {/* HEADER SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Beaker size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Recipe Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Recipe Name
                </label>
                <input
                  name="name"
                  placeholder="e.g. Standard Concrete Mix M25"
                  className="w-full h-10 px-4 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Base Production Qty
                </label>
                <input
                  name="targetQty"
                  type="number"
                  defaultValue="1"
                  className="w-full h-10 px-4 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div className="md:col-span-12 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Finished Product Output
                </label>
                <div className="relative group">
                  <Package
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  />
                  <select
                    name="finishedGoodId"
                    className="w-full h-10 pl-10 pr-4 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Item to Produce...</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* COMPONENT TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">
                Raw Materials Required
              </h3>
              <button
                type="button"
                onClick={() =>
                  setComponents([
                    ...components,
                    { stockItemId: "", quantity: 1 },
                  ])
                }
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 pl-6">Item Name</th>
                    <th className="px-4 py-3 w-40 text-right">Qty Needed</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {components.map((comp, idx) => (
                    <tr
                      key={idx}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 pl-6">
                        <select
                          value={comp.stockItemId}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[idx].stockItemId = e.target.value;
                            setComponents(newComps);
                          }}
                          className="w-full bg-transparent font-bold text-slate-700 outline-none cursor-pointer focus:text-blue-600"
                        >
                          <option value="">Select Raw Material...</option>
                          {stockItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={comp.quantity}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[idx].quantity = e.target.value;
                            setComponents(newComps);
                          }}
                          className="w-full text-right bg-transparent font-mono font-bold text-slate-900 outline-none border-b border-transparent focus:border-blue-500 focus:bg-white px-2 py-1 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-2 text-right pr-6">
                        <button
                          type="button"
                          onClick={() =>
                            setComponents(
                              components.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-6"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Processing...
              </>
            ) : (
              <>
                <Save size={16} /> Save Master Recipe
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
