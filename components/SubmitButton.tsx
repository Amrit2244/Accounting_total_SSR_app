"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

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
      className="group relative flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 min-w-[120px]"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && (
            <span className="group-hover:scale-110 transition-transform">
              {icon}
            </span>
          )}
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
