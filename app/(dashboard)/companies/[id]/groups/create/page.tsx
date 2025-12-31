import { createGroup } from "@/app/actions/groups";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch existing groups for parent selection
  const groups = await prisma.group.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl mx-auto p-8">
      <Link
        href={`/companies/${id}/ledgers`}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create New Group</h1>
      <form action={createGroup} className="space-y-4">
        <input type="hidden" name="companyId" value={companyId} />
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Group Name
          </label>
          <input
            name="name"
            required
            className="w-full p-3 border rounded-xl"
            placeholder="e.g. Current Assets"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Parent Group (Optional)
          </label>
          <select
            name="parentId"
            className="w-full p-3 border rounded-xl bg-white"
          >
            <option value="">No Parent (Root)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-indigo-600 transition-colors">
          Create Group
        </button>
      </form>
    </div>
  );
}
