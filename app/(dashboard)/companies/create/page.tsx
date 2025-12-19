"use client";

import { useActionState } from "react";
import { createCompany } from "@/app/actions/company";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Mail,
  Tag,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Globe,
} from "lucide-react";

// 1. Define State interface
interface CompanyActionState {
  success?: boolean;
  error?: string;
}

// ✅ FIX: Pass 'prevState' to the server action (it expects 2 args)
async function createCompanyWrapper(prevState: any, formData: FormData) {
  const result = await createCompany(prevState, formData);
  return result as CompanyActionState;
}

// 2. Define initial state
const initialState: CompanyActionState = {
  success: false,
  error: "",
};

export default function CreateCompanyPage() {
  const [state, action, isPending] = useActionState(
    createCompanyWrapper,
    initialState
  );

  return (
    <div className="max-w-xl mx-auto py-8 px-4 font-sans">
      {/* COMPACT HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <span className="text-slate-500">System Setup</span>
            <ChevronRight size={10} />
            <span className="text-slate-900">Onboarding</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow-sm">
              <Building2 size={16} />
            </div>
            Setup New Company
          </h1>
        </div>
        <Link
          href="/"
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {/* STATUS MESSAGES */}
        {state?.error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight animate-in fade-in">
            <AlertCircle size={14} /> {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-2 rounded-lg mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight animate-in fade-in">
            <CheckCircle size={14} /> Company created successfully!
            Redirecting...
          </div>
        )}

        <form action={action} className="space-y-4">
          {/* 1. IDENTITY SECTION */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="name"
                type="text"
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g. ACME Corp Pvt Ltd"
              />
            </div>
          </div>

          {/* 2. LOCATION GRID */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Mailing Address
              </label>
              <textarea
                name="address"
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all resize-none"
                placeholder="Street, Building, Area..."
              ></textarea>
            </div>

            <div className="col-span-7 space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                State
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="state"
                  type="text"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="col-span-5 space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Pincode
              </label>
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="pincode"
                  type="text"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="Zip"
                />
              </div>
            </div>
          </div>

          {/* 3. COMPLIANCE GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Official Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="email"
                  type="email"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="accounts@company.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                GSTIN / Tax ID
              </label>
              <div className="relative">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="gstin"
                  type="text"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:normal-case"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* 4. FISCAL YEAR CONFIG (High Contrast Box) */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-blue-700 ml-1">
                Financial Year From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  name="financialYearFrom"
                  type="date"
                  defaultValue={new Date().getFullYear() + "-04-01"}
                  required
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-blue-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-blue-700 ml-1">
                Books Begin From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  name="booksBeginFrom"
                  type="date"
                  defaultValue={new Date().getFullYear() + "-04-01"}
                  required
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-blue-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              disabled={isPending}
              type="submit"
              className="flex-[2] h-10 bg-[#003366] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Save size={14} /> Initialize Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
