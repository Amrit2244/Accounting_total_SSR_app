import { prisma } from "@/lib/prisma";
import CreateLedgerForm from "./form"; // We will create this client component next

export default async function CreateLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch Company Name for display
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  // Fetch All Groups (to show in dropdown)
  // We sort them so "Bank Accounts", "Sundry Debtors" are easy to find
  const groups = await prisma.accountGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-300 mt-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-extrabold text-black">Create Ledger</h1>
        <p className="text-gray-600 text-sm">for {company?.name}</p>
      </div>

      <CreateLedgerForm companyId={companyId} groups={groups} />
    </div>
  );
}
