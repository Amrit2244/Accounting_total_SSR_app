"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Loader2,
  Save,
  AlertCircle,
  MapPin,
  Mail,
  Hash,
  Building2,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  address?: string | null;
  state?: string | null;
  pincode?: string | null;
  email?: string | null;
  gstin?: string | null;
  financialYearFrom: string;
  booksBeginFrom: string;
}

interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

interface EditCompanyFormProps {
  initialCompany: Company;
  // Match the type signature used in your server action
  updateAction: (prevState: any, formData: FormData) => Promise<any>;
}

export default function EditCompanyForm({
  initialCompany,
  updateAction,
}: EditCompanyFormProps) {
  // Initialize useActionState with the server action
  const [state, action, isPending] = useActionState(updateAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-scroll to top if there is an error message
  useEffect(() => {
    if (state?.message || state?.errors) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state]);

  return (
    <form action={action} ref={formRef} className="space-y-6">
      {/* Hidden field to pass ID to the Server Action */}
      <input type="hidden" name="id" value={initialCompany.id} />

      {/* ERROR MESSAGE */}
      {state?.message && !state?.success && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          {state.message}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {state?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          Company profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPANY NAME */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" /> Company Name
          </label>
          <input
            name="name"
            defaultValue={initialCompany.name}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            required
          />
          {state?.errors?.name && (
            <p className="text-xs text-red-500 font-bold">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* ADDRESS */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" /> Address
          </label>
          <textarea
            name="address"
            defaultValue={initialCompany.address || ""}
            rows={2}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* STATE & PINCODE */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">State</label>
          <input
            name="state"
            defaultValue={initialCompany.state || ""}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Pincode
          </label>
          <input
            name="pincode"
            defaultValue={initialCompany.pincode || ""}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* FINANCIAL YEAR SECTION */}
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Financial Year From
            </label>
            <input
              name="financialYearFrom"
              type="date"
              defaultValue={initialCompany.financialYearFrom}
              required
              className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Books Begin From
            </label>
            <input
              name="booksBeginFrom"
              type="date"
              defaultValue={initialCompany.booksBeginFrom}
              required
              className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* EMAIL & GSTIN */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Mail size={16} className="text-blue-600" /> Email Address
          </label>
          <input
            name="email"
            type="email"
            defaultValue={initialCompany.email || ""}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Hash size={16} className="text-blue-600" /> GSTIN
          </label>
          <input
            name="gstin"
            defaultValue={initialCompany.gstin || ""}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono"
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="pt-6 border-t border-slate-100">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#003366] hover:bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Update Company Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
