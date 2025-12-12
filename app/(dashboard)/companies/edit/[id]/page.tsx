import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/app/actions/company";
import Link from "next/link";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params for Next.js 15+
  const { id } = await params;
  const companyId = parseInt(id);

  // Fetch existing data
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return <div>Company not found</div>;
  }

  // Bind the ID to the server action so we know which company to update
  const updateActionWithId = updateCompany.bind(null, companyId);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-300 mt-10">
      <h1 className="text-2xl font-extrabold mb-6 text-black">
        Edit Company: {company.name}
      </h1>

      <form action={updateActionWithId} className="space-y-6">
        {/* Name Section */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Company Name
          </label>
          <input
            name="name"
            type="text"
            defaultValue={company.name}
            required
            className="w-full border border-gray-400 p-2 rounded text-black focus:ring-2 focus:ring-black outline-none bg-gray-50"
          />
        </div>

        {/* Address Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Mailing Address
            </label>
            <textarea
              name="address"
              rows={2}
              defaultValue={company.address || ""}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              State
            </label>
            <input
              name="state"
              type="text"
              defaultValue={company.state || ""}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Pincode
            </label>
            <input
              name="pincode"
              type="text"
              defaultValue={company.pincode || ""}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
        </div>

        {/* Contact & Tax */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={company.email || ""}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              GSTIN / Tax No
            </label>
            <input
              name="gstin"
              type="text"
              defaultValue={company.gstin || ""}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/"
            className="px-6 py-2 border border-gray-400 rounded text-black font-bold hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800"
          >
            Update Company
          </button>
        </div>
      </form>
    </div>
  );
}
