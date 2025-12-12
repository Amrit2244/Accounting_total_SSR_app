import { prisma } from "@/lib/prisma";
import CreateItemForm from "./form";

export default async function CreateItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const units = await prisma.unit.findMany({ where: { companyId } });

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-400 mt-10">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-black">
          Create Stock Item
        </h1>
        <p className="text-sm font-medium text-gray-700 mt-1">
          Add a new product to your inventory
        </p>
      </div>

      <CreateItemForm companyId={companyId} units={units} />
    </div>
  );
}
