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
  Briefcase,
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <span className="text-slate-500">System Setup</span>
              <ChevronRight size={10} />
              <span className="text-slate-900">Onboarding</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              <Briefcase size={22} className="text-indigo-600" />
              Setup New Company
            </h1>
          </div>

          <Link
            href="/"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
            title="Cancel & Go Back"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* FORM CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-visible relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-2xl" />

          <div className="p-6 md:p-8">
            {/* STATUS MESSAGES */}
            {state?.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <AlertCircle size={16} /> {state.error}
              </div>
            )}
            {state?.success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle size={16} /> Company created successfully!
                Redirecting...
              </div>
            )}

            <form action={action} className="space-y-5">
              {/* 1. IDENTITY SECTION */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Building2
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  />
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="e.g. ACME Corp Pvt Ltd"
                  />
                </div>
              </div>

              {/* 2. LOCATION GRID */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Mailing Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-400"
                    placeholder="Street, Building, Area..."
                  ></textarea>
                </div>

                <div className="col-span-7 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    State
                  </label>
                  <div className="relative group">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="state"
                      type="text"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="State / Province"
                    />
                  </div>
                </div>

                <div className="col-span-5 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Pincode
                  </label>
                  <div className="relative group">
                    <Globe
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="pincode"
                      type="text"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Zip Code"
                    />
                  </div>
                </div>
              </div>

              {/* 3. COMPLIANCE GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Official Email
                  </label>
                  <div className="relative group">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="email"
                      type="email"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="accounts@company.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    GSTIN / Tax ID
                  </label>
                  <div className="relative group">
                    <Tag
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="gstin"
                      type="text"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold uppercase focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:normal-case"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* 4. FISCAL YEAR CONFIG */}
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 grid grid-cols-2 gap-5 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-indigo-700 ml-1">
                    Financial Year From <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="financialYearFrom"
                      type="date"
                      defaultValue={new Date().getFullYear() + "-04-01"}
                      required
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-indigo-700 ml-1">
                    Books Begin From <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors"
                    />
                    <input
                      name="booksBeginFrom"
                      type="date"
                      defaultValue={new Date().getFullYear() + "-04-01"}
                      required
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <Link
                  href="/"
                  className="flex-1 h-11 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 font-bold uppercase tracking-wider text-[10px] hover:bg-slate-50 hover:text-slate-800 transition-all"
                >
                  Cancel
                </Link>
                <button
                  disabled={isPending}
                  type="submit"
                  className="flex-[2] h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-indigo-600 shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      initializing...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Create Company
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
