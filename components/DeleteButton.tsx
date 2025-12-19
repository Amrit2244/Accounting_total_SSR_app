"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

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
    if (!confirm("Confirm deletion? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await action(id, companyId);
      if (res.error) alert(res.error);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-slate-300 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
      title="Delete Record"
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </button>
  );
}
