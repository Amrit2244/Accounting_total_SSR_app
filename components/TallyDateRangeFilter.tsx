"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";
import { format, isValid } from "date-fns";

// --- SMART DATE PARSER ---
const parseTallyDate = (input: string): Date | null => {
  if (!input) return null;
  const today = new Date();

  // Clean input: replace dots/slashes/spaces with hyphens
  const clean = input.trim().replace(/[./\s]/g, "-");
  const parts = clean.split("-");

  let d = today.getDate();
  let m = today.getMonth(); // 0-indexed
  let y = today.getFullYear();

  if (parts.length === 1) {
    // Case: "5" -> 5th of current month
    d = parseInt(parts[0]);
  } else if (parts.length === 2) {
    // Case: "5-4" -> 5th of April, current year
    d = parseInt(parts[0]);
    m = parseInt(parts[1]) - 1;
  } else if (parts.length === 3) {
    // Case: "5-4-24" -> 5th April 2024
    d = parseInt(parts[0]);
    m = parseInt(parts[1]) - 1;
    let yPart = parseInt(parts[2]);
    y = yPart < 100 ? 2000 + yPart : yPart;
  }

  const result = new Date(y, m, d);
  return isValid(result) ? result : null;
};

export default function TallyDateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial State from URL
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");

  useEffect(() => {
    const f = searchParams.get("from");
    const t = searchParams.get("to");
    if (f) setFromStr(format(new Date(f), "dd-MM-yyyy"));
    if (t) setToStr(format(new Date(t), "dd-MM-yyyy"));
  }, [searchParams]);

  const applyDate = (type: "from" | "to", value: string) => {
    if (!value) return; // Don't act on empty blur

    const dateObj = parseTallyDate(value);

    if (dateObj) {
      const isoDate = format(dateObj, "yyyy-MM-dd");
      const displayDate = format(dateObj, "dd-MM-yyyy");

      const params = new URLSearchParams(searchParams.toString());
      params.set(type, isoDate);

      // Auto-set 'to' date if setting 'from' and 'to' is missing
      if (type === "from" && !params.get("to")) {
        params.set("to", isoDate);
        setToStr(displayDate);
      }

      router.push(`?${params.toString()}`);

      // Update local input to look formatted
      if (type === "from") setFromStr(displayDate);
      if (type === "to") setToStr(displayDate);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "from" | "to"
  ) => {
    if (e.key === "Enter") {
      applyDate(type, e.currentTarget.value);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shadow-sm h-9 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all w-48 lg:w-56">
      <Calendar size={14} className="text-slate-400 shrink-0" />

      {/* FROM DATE */}
      <input
        type="text"
        className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent placeholder:text-slate-400 text-center"
        placeholder="DD-MM"
        value={fromStr}
        onChange={(e) => setFromStr(e.target.value)}
        onBlur={(e) => applyDate("from", e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, "from")}
      />

      <ArrowRight size={12} className="text-slate-300 shrink-0" />

      {/* TO DATE */}
      <input
        type="text"
        className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent placeholder:text-slate-400 text-center"
        placeholder="DD-MM"
        value={toStr}
        onChange={(e) => setToStr(e.target.value)}
        onBlur={(e) => applyDate("to", e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, "to")}
      />
    </div>
  );
}
