"use client";

import React, { useState, useActionState } from "react";
import { Plus, Trash2, Save, Loader2, Beaker } from "lucide-react";
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
    <form action={action} className="space-y-4 font-sans">
      <input type="hidden" name="companyId" value={companyId} />
      <input
        type="hidden"
        name="components"
        value={JSON.stringify(components.filter((c) => c.stockItemId))}
      />

      {/* HEADER SECTION */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
          <Beaker size={14} /> Recipe Header
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Recipe Name
            </label>
            <input
              name="name"
              placeholder="e.g. Standard Concrete Mix"
              className="w-full h-9 px-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Base Production Qty
            </label>
            <input
              name="targetQty"
              type="number"
              defaultValue="1"
              className="w-full h-9 px-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Finished Product
            </label>
            <select
              name="finishedGoodId"
              className="w-full h-9 px-3 bg-slate-900 text-white rounded-lg border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Item...</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* COMPONENT TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Raw Materials
          </h3>
          <button
            type="button"
            onClick={() =>
              setComponents([...components, { stockItemId: "", quantity: 1 }])
            }
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2 text-right w-32">Qty Required</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {components.map((comp, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2">
                  <select
                    value={comp.stockItemId}
                    onChange={(e) => {
                      const newComps = [...components];
                      newComps[idx].stockItemId = e.target.value;
                      setComponents(newComps);
                    }}
                    className="w-full bg-transparent font-bold outline-none"
                  >
                    <option value="">Select Material...</option>
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
                    className="w-full text-right bg-transparent font-mono font-bold outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setComponents(components.filter((_, i) => i !== idx))
                    }
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
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
        className="w-full h-10 bg-[#003366] text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md"
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <Save size={14} />
        )}{" "}
        Save Recipe
      </button>

      {state?.success && (
        <p className="text-center text-emerald-600 font-bold text-xs uppercase">
          {state.message}
        </p>
      )}
      {state?.error && (
        <p className="text-center text-red-600 font-bold text-xs uppercase">
          {state.error}
        </p>
      )}
    </form>
  );
}
