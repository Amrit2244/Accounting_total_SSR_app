import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditItemForm from "./edit-form"; // ✅ Import the new Client Component

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const companyId = parseInt(id);
  const iId = parseInt(itemId);

  // Fetch Data on Server
  const item = await prisma.stockItem.findUnique({ where: { id: iId } });

  if (!item)
    return <div className="p-10 text-red-500 font-bold">Item not found</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white border border-gray-300 rounded-lg mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#003366]">Edit Stock Item</h1>
        <Link
          href={`/companies/${companyId}/inventory`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* ✅ Pass data to Client Form */}
      <EditItemForm companyId={companyId} item={item} />
    </div>
  );
}
