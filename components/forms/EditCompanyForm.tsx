"use client";

import { useActionState } from "react";
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
  error?: string;
  success?: boolean;
}

interface EditCompanyFormProps {
  initialCompany: Company;
  updateAction: (prevState: any, formData: FormData) => Promise<FormState>;
}

export default function EditCompanyForm({
  initialCompany,
  updateAction,
}: EditCompanyFormProps) {
  const [state, action, isPending] = useActionState(updateAction, {});

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={initialCompany.id} />

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <AlertCircle size={20} />
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle2 size={20} />
          Company updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" /> Company Name
          </label>
          <input
            name="name"
            defaultValue={initialCompany.name}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

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

        {/* ✅ NEW: Financial Year Configuration Section */}
        <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
              <Calendar size={14} /> Financial Year From
            </label>
            <input
              name="financialYearFrom"
              type="date"
              defaultValue={initialCompany.financialYearFrom}
              required
              className="w-full p-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
              <Calendar size={14} /> Books Begin From
            </label>
            <input
              name="booksBeginFrom"
              type="date"
              defaultValue={initialCompany.booksBeginFrom}
              required
              className="w-full p-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Mail size={16} className="text-blue-600" /> Email
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
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[#003366] hover:bg-black text-white py-3 rounded-lg font-bold shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {isPending ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
