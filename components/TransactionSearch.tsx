"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LockKeyhole } from "lucide-react";

export default function TransactionSearch({
  companyId,
}: {
  companyId: number;
}) {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 5) {
      // Redirect to a special verification page
      router.push(`/companies/${companyId}/vouchers/verify/${code}`);
    } else {
      alert("Please enter a valid 5-digit Transaction ID");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 bg-[#002244] p-1 rounded-md border border-blue-800 shadow-inner"
    >
      <LockKeyhole size={16} className="text-yellow-400 ml-2" />
      <input
        type="text"
        placeholder="ENTER TRANS ID (e.g. 82910)"
        className="bg-transparent text-white placeholder-blue-300 text-xs font-mono font-bold w-48 outline-none tracking-widest"
        maxLength={5}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="bg-yellow-500 hover:bg-yellow-400 text-[#002244] text-[10px] font-bold px-3 py-1.5 rounded">
        OPEN
      </button>
    </form>
  );
}
