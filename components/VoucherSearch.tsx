"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

export default function VoucherSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize state only once from the URL
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    // Check if the current URL already matches the state to prevent loop
    const currentQ = searchParams.get("q") || "";
    if (query === currentQ) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        // use 'replace' instead of 'push' to keep browser history clean
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-1 relative">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {isPending ? (
            <Loader2 size={14} className="animate-spin text-blue-500" />
          ) : (
            <Search size={14} />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Voucher No, TXID, or Ledger Name..."
          className="w-full pl-9 pr-8 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 font-medium outline-none bg-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
