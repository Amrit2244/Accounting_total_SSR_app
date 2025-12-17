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
} from "lucide-react";

export default function CreateCompanyPage() {
  const [state, action, isPending] = useActionState(createCompany, undefined);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl border border-slate-200">
        <h1 className="text-2xl font-extrabold mb-8 text-slate-900 flex items-center gap-3">
          <Building2 className="text-blue-600" /> Setup New Company
        </h1>

        {/* Error/Success Feedback */}
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-medium p-4 rounded-lg mb-6 flex items-center gap-3 text-sm">
            <AlertCircle size={18} /> {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 font-medium p-4 rounded-lg mb-6 flex items-center gap-3 text-sm">
            <CheckCircle size={18} /> Company created successfully!
            Redirecting...
          </div>
        )}

        <form action={action} className="space-y-6">
          {/* Name Section */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="name"
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="e.g. ABC Pvt Ltd"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Mailing Address
              </label>
              <textarea
                name="address"
                rows={2}
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                placeholder="Street, Area, Building"
              ></textarea>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                State
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="state"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Pincode
              </label>
              <input
                name="pincode"
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Contact & Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                GSTIN / Tax No
              </label>
              <div className="relative">
                <Tag
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="gstin"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm uppercase"
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </div>
          </div>

          {/* Fiscal Year Section (Highlighted) */}
          <div className="bg-blue-50/50 p-5 rounded-xl grid grid-cols-2 gap-6 border border-blue-200">
            <div className="space-y-1.5">
              <label className="block text-sm font-extrabold text-blue-800">
                Financial Year From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                />
                <input
                  name="financialYearFrom"
                  type="date"
                  defaultValue={new Date().getFullYear() + "-04-01"}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-extrabold text-blue-800">
                Books Beginning From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                />
                <input
                  name="booksBeginFrom"
                  type="date"
                  defaultValue={new Date().getFullYear() + "-04-01"}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/"
              className="w-32 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft size={16} /> Cancel
            </Link>
            <button
              disabled={isPending}
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
