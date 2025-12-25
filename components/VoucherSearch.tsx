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
    <div className="relative flex-1 group min-w-[200px]">
      <div
        className={`flex items-center w-full bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200
          focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 hover:shadow-md
        `}
      >
        <div className="pl-3 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          {isPending ? (
            <Loader2 size={16} className="animate-spin text-indigo-500" />
          ) : (
            <Search size={16} />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vouchers, TXID, or ledgers..."
          className="w-full h-10 pl-3 pr-8 bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium placeholder:tracking-normal tracking-wide transition-all"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 p-0.5 rounded-full transition-all active:scale-95"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
