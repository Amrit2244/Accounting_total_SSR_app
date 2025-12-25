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
    <form action={action} ref={formRef} className="space-y-8 font-sans">
      {/* Hidden field to pass ID to the Server Action */}
      <input type="hidden" name="id" value={initialCompany.id} />

      {/* FEEDBACK BANNERS */}
      {state?.message && !state?.success && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          {state.message}
        </div>
      )}

      {state?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          Company profile updated successfully!
        </div>
      )}

      {/* MAIN FORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPANY NAME */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
            Company Name
          </label>
          <div className="relative group">
            <Building2
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="name"
              defaultValue={initialCompany.name}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>
          {state?.errors?.name && (
            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* ADDRESS */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Mailing Address
          </label>
          <div className="relative group">
            <MapPin
              size={16}
              className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <textarea
              name="address"
              defaultValue={initialCompany.address || ""}
              rows={3}
              className="w-full p-3 pl-10 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-400 bg-white"
            />
          </div>
        </div>

        {/* STATE & PINCODE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            State
          </label>
          <input
            name="state"
            defaultValue={initialCompany.state || ""}
            className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Pincode
          </label>
          <input
            name="pincode"
            defaultValue={initialCompany.pincode || ""}
            className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
          />
        </div>

        {/* FINANCIAL YEAR SECTION */}
        <div className="md:col-span-2 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-5 relative overflow-hidden">
          {/* Decorative left border */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
              <Calendar size={12} /> Financial Year From
            </label>
            <input
              name="financialYearFrom"
              type="date"
              defaultValue={initialCompany.financialYearFrom}
              required
              className="w-full h-10 px-4 border border-slate-300 bg-white rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
              <Calendar size={12} /> Books Begin From
            </label>
            <input
              name="booksBeginFrom"
              type="date"
              defaultValue={initialCompany.booksBeginFrom}
              required
              className="w-full h-10 px-4 border border-slate-300 bg-white rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* EMAIL & GSTIN */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="email"
              type="email"
              defaultValue={initialCompany.email || ""}
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
            GSTIN
          </label>
          <div className="relative group">
            <Hash
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              name="gstin"
              defaultValue={initialCompany.gstin || ""}
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm font-bold font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white placeholder:normal-case"
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-600/20 active:scale-95"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Update Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
