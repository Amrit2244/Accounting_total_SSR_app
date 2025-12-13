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
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    startTransition(async () => {
      const res = await action(id, companyId);
      if (res.error) alert(res.error);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
