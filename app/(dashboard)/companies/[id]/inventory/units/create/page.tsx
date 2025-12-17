import { ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";
import UnitForm from "@/components/forms/UnitForm"; // Import the client form

export default async function CreateUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
              <Scale size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Create Unit</h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Define a new measurement unit for inventory.
          </p>
        </div>

        <Link
          href={`/companies/${companyId}/inventory/units`}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* 2. Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        <UnitForm companyId={companyId} />
      </div>
    </div>
  );
}
