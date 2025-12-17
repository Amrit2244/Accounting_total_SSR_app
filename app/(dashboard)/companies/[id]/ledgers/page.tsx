// app/(dashboard)/companies/[id]/ledgers/page.tsx

import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Book, Plus, ChevronRight } from "lucide-react";
import LedgerTable from "@/components/LedgerTable";
import { notFound } from "next/navigation"; // Recommended Next.js utility for 404

// Define the exact Params type expected from the URL segments
type LedgerListParams = {
  id: string; // Corresponds to [id] (companyId)
};

export default async function LedgerListPage({
  params,
}: {
  params: LedgerListParams;
}) {
  // Safely get the ID, defensive coding to ensure 'id' is always treated as a string or falls back.
  const id = params?.id;

  // --- CRITICAL FIX: Robust Parameter Validation ---
  const companyId = parseInt(id);

  // 1. Check if ID is invalid (NaN or 0) due to faulty URL or parsing
  if (!id || isNaN(companyId) || companyId <= 0) {
    // If the ID is bad, we can either return a custom error or use notFound()
    // Using notFound() is the standard way to trigger a 404 page in Next.js
    // notFound();

    // For debugging, we return the custom error message:
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Invalid URL Parameter
        </h1>
        <p className="text-slate-600">
          The Company ID in the URL is missing or invalid. Please check the URL.
        </p>
      </div>
    );
  }
  // --- END CRITICAL FIX ---

  // Fetch Ledgers
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { group: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-medium">Ledgers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Book className="text-blue-600" /> Ledger Masters
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your Chart of Accounts (Bank, Cash, Parties, Expenses).
          </p>
        </div>

        <div className="flex gap-3">
          {/* Back Button */}
          <Link
            href={`/companies/${companyId}`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          {/* Create Button */}
          <Link
            href={`/companies/${companyId}/ledgers/create`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Ledger
          </Link>
        </div>
      </div>

      {/* 2. TABLE CARD: Renders the LedgerTable component */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <LedgerTable ledgers={ledgers} companyId={companyId} />
      </div>
    </div>
  );
}
