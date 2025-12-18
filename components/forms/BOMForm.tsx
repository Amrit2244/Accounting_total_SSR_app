"use client";

import React, { useState, useActionState } from "react";
import { Plus, Trash2, Save, Loader2, Package, Beaker } from "lucide-react";
import { createBOM } from "@/app/actions/bom";

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
  const [state, action, isPending] = useActionState(createBOM as any, null);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="companyId" value={companyId} />
      <input
        type="hidden"
        name="components"
        value={JSON.stringify(components.filter((c) => c.stockItemId))}
      />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
          <Beaker size={18} /> Recipe Header
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
              Recipe Name
            </label>
            <input
              name="name"
              placeholder="e.g., Standard Concrete Mix"
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
              Base Production Qty
            </label>
            <input
              name="targetQty"
              type="number"
              defaultValue="1"
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
              Finished Product
            </label>
            <select
              name="finishedGoodId"
              className="w-full p-4 bg-slate-900 text-white rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            >
              <option value="">Select Finished Item...</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-8 py-5 border-b flex justify-between items-center">
          <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">
            Raw Materials (Components)
          </h3>
          <button
            type="button"
            onClick={() =>
              setComponents([...components, { stockItemId: "", quantity: 1 }])
            }
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-8 py-4 text-left">Item Name</th>
              <th className="px-8 py-4 text-right w-40">Qty Required</th>
              <th className="px-8 py-4 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {components.map((comp, idx) => (
              <tr key={idx}>
                <td className="px-8 py-4">
                  <select
                    value={comp.stockItemId}
                    onChange={(e) => {
                      const newComps = [...components];
                      newComps[idx].stockItemId = e.target.value;
                      setComponents(newComps);
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 font-bold"
                  >
                    <option value="">Select Raw Material...</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-8 py-4">
                  <input
                    type="number"
                    value={comp.quantity}
                    onChange={(e) => {
                      const newComps = [...components];
                      newComps[idx].quantity = e.target.value;
                      setComponents(newComps);
                    }}
                    className="w-full text-right bg-transparent border-none focus:ring-0 font-mono font-bold"
                  />
                </td>
                <td className="px-8 py-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setComponents(components.filter((_, i) => i !== idx))
                    }
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        disabled={isPending}
        type="submit"
        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        Save Production Recipe
      </button>

      {state?.success && (
        <p className="text-center text-emerald-600 font-bold">
          {state.message}
        </p>
      )}
      {state?.error && (
        <p className="text-center text-red-600 font-bold">{state.error}</p>
      )}
    </form>
  );
}
