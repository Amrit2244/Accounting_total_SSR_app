import { ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";
import UnitForm from "./form"; // We create this next

export default async function CreateUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/companies/${companyId}/inventory/units`}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="w-6 h-6" />
          Create Unit
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <UnitForm companyId={companyId} />
      </div>
    </div>
  );
}
