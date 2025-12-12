import CreateUnitForm from "./form";

// Server Component: safely unwraps params
export default async function CreateUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-400 mt-10">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h2 className="text-2xl font-extrabold text-black">Create Unit</h2>
        <p className="text-sm text-gray-600">
          Define how you measure your items
        </p>
      </div>

      <CreateUnitForm companyId={companyId} />
    </div>
  );
}
