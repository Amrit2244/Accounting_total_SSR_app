"use client";

import { useActionState, useState, useMemo, useRef, useEffect } from "react";
import { createLedger } from "@/app/actions/masters";
import Link from "next/link";
import {
  Save,
  XCircle,
  ChevronDown,
  IndianRupee,
  Landmark,
  MapPin,
  Fingerprint,
  Home,
  Search,
  Check,
  CheckCircle2, // Added for success icon
  ArrowRight,
} from "lucide-react";

type Group = {
  id: number;
  name: string;
};

export default function CreateLedgerForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  const [state, action, isPending] = useActionState(createLedger, undefined);

  // --- Smart Search State ---
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase())
    );
  }, [groups, groupSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsGroupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form action={action} className="space-y-8">
      {/* --- SUCCESS MESSAGE --- */}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[2rem] animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-emerald-900 font-black uppercase text-xs tracking-widest">
                Action Successful
              </h3>
              <p className="text-emerald-700 font-bold text-sm">
                {state.message || "Ledger has been added to your masters."}
              </p>
            </div>
            <Link
              href={`/companies/${companyId}/ledgers`}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-tighter rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              View List <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* --- ERROR MESSAGE --- */}
      {state?.message && !state.success && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 font-bold flex items-center gap-3 animate-shake">
          <XCircle size={18} />
          {state.message}
        </div>
      )}

      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="groupId" value={selectedGroup?.id || ""} />

      <div className="grid gap-8">
        {/* BASIC INFO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Ledger Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. HDFC Current Account"
              className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2" ref={dropdownRef}>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Under Group
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsGroupOpen(!isGroupOpen)}
                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold flex items-center justify-between focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              >
                <span
                  className={
                    selectedGroup
                      ? "text-slate-900"
                      : "text-slate-400 font-medium"
                  }
                >
                  {selectedGroup
                    ? selectedGroup.name
                    : "Search account group..."}
                </span>
                <ChevronDown
                  className={`text-slate-400 transition-transform ${
                    isGroupOpen ? "rotate-180" : ""
                  }`}
                  size={18}
                />
              </button>

              {isGroupOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                      />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Type to filter..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroup(g);
                            setIsGroupOpen(false);
                            setGroupSearch("");
                          }}
                          className="w-full px-5 py-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between transition-colors"
                        >
                          {g.name}
                          {selectedGroup?.id === g.id && (
                            <Check size={14} className="text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-5 text-center text-xs text-slate-400 font-medium uppercase tracking-widest">
                        No groups found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STATUTORY & BUSINESS DETAILS */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2 px-1">
            Business & Statutory Details
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1">
                <Landmark size={14} />
                <label className="text-[10px] font-bold uppercase tracking-wider">
                  Tally Alias
                </label>
              </div>
              <input
                name="tallyName"
                type="text"
                placeholder="Alias name"
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1">
                <MapPin size={14} />
                <label className="text-[10px] font-bold uppercase tracking-wider">
                  State
                </label>
              </div>
              <input
                name="state"
                type="text"
                placeholder="e.g. Punjab"
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1">
                <Fingerprint size={14} />
                <label className="text-[10px] font-bold uppercase tracking-wider">
                  GSTIN
                </label>
              </div>
              <input
                name="gstin"
                type="text"
                placeholder="15-digit GSTIN"
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1 ml-1">
              <Home size={14} />
              <label className="text-[10px] font-bold uppercase tracking-wider">
                Address
              </label>
            </div>
            <textarea
              name="address"
              rows={3}
              placeholder="Enter full business address..."
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* OPENING BALANCE SECTION */}
        <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <IndianRupee size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Opening Balance Configuration
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full h-14 px-6 bg-white/10 border border-white/10 rounded-2xl text-white font-mono text-xl font-bold placeholder:text-white/20 focus:bg-white/20 outline-none transition-all text-right"
              />
            </div>
            <div className="col-span-4">
              <select
                name="balanceType"
                className="w-full h-14 px-4 bg-white/10 border border-white/10 rounded-2xl text-white font-black outline-none focus:bg-white/20 transition-all cursor-pointer"
              >
                <option value="Dr" className="text-black">
                  DEBIT (Dr)
                </option>
                <option value="Cr" className="text-black">
                  CREDIT (Cr)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Link
          href={`/companies/${companyId}/ledgers`}
          className="flex-1 h-14 flex items-center justify-center border border-slate-200 rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
        >
          Cancel
        </Link>
        <button
          disabled={isPending}
          type="submit"
          className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {isPending ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} /> Create Account
            </>
          )}
        </button>
      </div>
    </form>
  );
}
