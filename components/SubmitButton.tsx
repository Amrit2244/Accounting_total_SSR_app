"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  text,
  icon,
}: {
  text: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#003366] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#002244] disabled:opacity-50 flex items-center gap-2 transition-all"
    >
      {pending ? (
        "Saving..."
      ) : (
        <>
          {icon} {text}
        </>
      )}
    </button>
  );
}
