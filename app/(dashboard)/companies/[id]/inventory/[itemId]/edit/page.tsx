import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import EditItemForm from "./edit-form";

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

  if (!item) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
        <div className="text-rose-500 text-lg font-bold mb-2">
          Item Not Found
        </div>
        <p className="text-slate-500 mb-6 text-sm">
          The stock item you are trying to edit does not exist or has been
          deleted.
        </p>
        <Link
          href={`/companies/${companyId}/inventory`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PackageCheck size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Edit Stock Item
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Update details for{" "}
            <span className="font-semibold text-slate-800">{item.name}</span>
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/inventory`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* 2. Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        {/* Pass data to Client Form */}
        <EditItemForm companyId={companyId} item={item} />
      </div>
    </div>
  );
}
