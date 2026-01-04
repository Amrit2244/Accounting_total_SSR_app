"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { deleteCompany } from "@/app/actions/company";

export default function DeleteCompanyButton({
  companyId,
  hasVouchers,
}: {
  companyId: number;
  hasVouchers: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "⚠ CRITICAL WARNING ⚠\n\n" +
        "Are you sure you want to DELETE this company?\n" +
        "- All Ledgers, Items, and Settings will be lost forever.\n" +
        "- This action CANNOT be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);
    const res = await deleteCompany(companyId);

    if (res?.error) {
      alert(`Error: ${res.error}`);
      setIsDeleting(false);
    }
  };

  // 1. LOCKED STATE (If vouchers exist)
  if (hasVouchers) {
    return (
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
        <div className="p-2 bg-amber-100 rounded-full shrink-0">
          <ShieldAlert size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider mb-1">
            Deletion Locked
          </h3>
          <p className="text-xs leading-relaxed opacity-90">
            This company cannot be deleted because it contains verified
            transactions.
            <span className="font-bold">
              {" "}
              You must delete all vouchers from the Daybook first.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // 2. ACTIVE STATE (Safe to delete)
  return (
    <div className="mt-10 pt-8 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-rose-50/50 border border-rose-100 rounded-2xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-rose-950 uppercase tracking-wide flex items-center gap-2">
            <Trash2 size={16} className="text-rose-500" /> Danger Zone
          </h3>
          <p className="text-xs text-rose-800/70">
            Permanently remove this company and all associated data.
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="group px-6 py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:border-rose-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isDeleting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>Delete Company</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
