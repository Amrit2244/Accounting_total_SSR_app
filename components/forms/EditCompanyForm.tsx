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
} from "lucide-react";

// ✅ Define the structure of the Company object
interface Company {
  id: number;
  name: string;
  address?: string | null;
  state?: string | null;
  pincode?: string | null;
  email?: string | null;
  gstin?: string | null;
}

// ✅ Define the structure of the Form State
interface FormState {
  error?: string;
  success?: boolean;
}

// ✅ Define the Props for the component
interface EditCompanyFormProps {
  initialCompany: Company;
  updateAction: (prevState: any, formData: FormData) => Promise<FormState>;
}

export default function EditCompanyForm({
  initialCompany,
  updateAction,
}: EditCompanyFormProps) {
  // Initialize with an empty object instead of null to avoid type errors on state?.error
  const [state, action, isPending] = useActionState(updateAction, {});

  return (
    <form action={action} className="space-y-6">
      {/* Hidden ID input for Server Action */}
      <input type="hidden" name="id" value={initialCompany.id} />

      {/* --- Feedback States --- */}
      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={20} />
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={20} />
          Company updated successfully!
        </div>
      )}

      {/* --- Form Fields --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" /> Company Name
          </label>
          <input
            name="name"
            defaultValue={initialCompany.name}
            placeholder="Legal Company Name"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
            placeholder="Building, Street, Area..."
            rows={3}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">State</label>
          <input
            name="state"
            defaultValue={initialCompany.state || ""}
            placeholder="e.g. Maharashtra"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Pincode
          </label>
          <input
            name="pincode"
            defaultValue={initialCompany.pincode || ""}
            placeholder="6-digit PIN"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Mail size={16} className="text-blue-600" /> Email Address
          </label>
          <input
            name="email"
            type="email"
            defaultValue={initialCompany.email || ""}
            placeholder="contact@company.com"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Hash size={16} className="text-blue-600" /> GSTIN
          </label>
          <input
            name="gstin"
            defaultValue={initialCompany.gstin || ""}
            placeholder="15-digit GST Number"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
          />
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="pt-4 border-t border-slate-100 flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
