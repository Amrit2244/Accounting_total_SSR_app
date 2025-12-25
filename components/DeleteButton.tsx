"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";

type Props = {
  id: number;
  companyId: number;
  action: (
    id: number,
    cid: number
  ) => Promise<{ success?: boolean; error?: string }>;
};

export default function DeleteButton({ id, companyId, action }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // In a real app, replace this with a custom Modal/Dialog
    if (!confirm("Are you sure you want to permanently delete this record?"))
      return;

    startTransition(async () => {
      const res = await action(id, companyId);
      if (res?.error) alert(res.error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="group p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      title="Delete Record"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin text-rose-500" />
      ) : (
        <Trash2
          size={16}
          className="transition-transform group-hover:scale-110"
        />
      )}
      <span className="sr-only">Delete</span>
    </button>
  );
}
