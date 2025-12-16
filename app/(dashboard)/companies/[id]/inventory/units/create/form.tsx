"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom"; // Import this to handle loading state
import { createUnit } from "@/app/actions/masters";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react"; // Icon for the button

// 1. Create a helper component for the button to handle "Pending" state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        "Saving..."
      ) : (
        <>
          <Save className="w-4 h-4" /> Save Unit
        </>
      )}
    </button>
  );
}

// 2. The Main Form Component
export default function UnitForm({ companyId }: { companyId: number }) {
  const [state, action] = useActionState(createUnit, {
    message: null,
    errors: {},
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="companyId" value={companyId} />

      {/* Symbol Field */}
      <div className="space-y-2">
        <Label htmlFor="symbol">
          Symbol <span className="text-red-500">*</span>
        </Label>
        <Input
          id="symbol"
          name="symbol"
          placeholder="e.g. kg, pcs, mtr"
          required
        />
        {state?.errors?.symbol && (
          <p className="text-sm text-red-500">{state.errors.symbol[0]}</p>
        )}
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Formal Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Kilograms, Pieces, Meters"
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      {/* The Save Button is here */}
      <div className="pt-4">
        <SubmitButton />
      </div>

      {/* Error Message Display */}
      {state?.message && (
        <div className="p-3 bg-red-100 border border-red-200 rounded text-red-600 text-sm text-center">
          {state.message}
        </div>
      )}
    </form>
  );
}
