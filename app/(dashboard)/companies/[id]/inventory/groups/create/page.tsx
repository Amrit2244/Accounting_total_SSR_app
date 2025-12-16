import { prisma } from "@/lib/prisma";
import { ArrowLeft, Layers, Save } from "lucide-react";
import Link from "next/link";
import { createStockGroup } from "@/app/actions/masters";
import SubmitButton from "@/components/SubmitButton"; // Ensure you have this or use a simple button

export default async function CreateStockGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch existing groups to populate "Parent Group" dropdown
  const existingGroups = await prisma.stockGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <Layers size={24} /> Create Stock Group
        </h1>
        <Link
          href={`/companies/${companyId}/inventory/groups`}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
      </div>

      {/* FORM */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-6">
        <form action={createStockGroup} className="space-y-4">
          <input type="hidden" name="companyId" value={companyId} />

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Electronics, Raw Material"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#003366] outline-none"
            />
          </div>

          {/* Parent Group (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Parent Group (Optional)
            </label>
            <select
              name="parentId"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#003366] outline-none bg-white"
            >
              <option value="">(Primary)</option>
              {existingGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">
              Select "Primary" if this is a main category.
            </p>
          </div>

          <hr className="border-gray-100 my-4" />

          {/* Submit Button */}
          <div className="flex justify-end">
            <SubmitButton text="Save Group" icon={<Save size={16} />} />
          </div>
        </form>
      </div>
    </div>
  );
}
