import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
// 👇 Import the Client Component
import CreateLedgerForm from "@/components/forms/CreateLedgerForm";

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) notFound();

  // ✅ Fetch groups using 'prisma.group' (lowercase)
  const groups = await prisma.group.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl mx-auto py-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2">
          <BookOpen className="text-blue-600" size={20} /> New Ledger Entry
        </h1>
        <Link
          href={`/companies/${companyId}/chart-of-accounts`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm"
          title="Cancel"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* 👇 Render the Client Form and pass data as props */}
        <CreateLedgerForm companyId={companyId} groups={groups} />
      </div>
    </div>
  );
}
