import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateGroup } from "@/app/actions/group-actions";

interface PageProps {
  params: Promise<{
    id: string;
    groupId: string;
  }>;
}

export default async function EditGroupPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: companyId, groupId } = resolvedParams;

  const groupIdInt = Number(groupId);
  if (isNaN(groupIdInt)) return notFound();

  const group = await prisma.group.findUnique({
    where: { id: groupIdInt },
  });

  if (!group) notFound();

  const updateGroupWithIds = updateGroup.bind(null, companyId, groupId);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6">Edit Group</h1>
      <form action={updateGroupWithIds} className="space-y-4">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Group Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={group.name}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        {/* REMOVED Description Input */}

        <div className="flex justify-end gap-3 pt-4">
          <a
            href={`/companies/${companyId}/groups`}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Update Group
          </button>
        </div>
      </form>
    </div>
  );
}
