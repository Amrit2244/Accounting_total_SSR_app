import { ArrowLeft, PackagePlus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InventoryForm from "./form";

export default async function CreateInventoryPage({
  params,
}: {
  // 1. Update the type to a Promise
  params: Promise<{ id: string }>;
}) {
  // 2. Await the params to get the ID
  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id);

  if (isNaN(companyId)) notFound();

  const stockGroups = await prisma.stockGroup.findMany({
    where: { companyId },
  });

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/companies/${companyId}/inventory`}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PackagePlus className="w-6 h-6" />
          Create Stock Item
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <InventoryForm companyId={companyId} groups={stockGroups} />
      </div>
    </div>
  );
}
