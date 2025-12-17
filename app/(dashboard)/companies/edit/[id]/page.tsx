import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/app/actions/company";
import { notFound } from "next/navigation";
import EditCompanyForm from "@/components/forms/EditCompanyForm";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch existing data
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return notFound();
  }

  // 2. Prepare initial data for the form
  // Ensure dates are converted to strings for the HTML date inputs
  const initialCompanyData = {
    id: company.id,
    name: company.name,
    address: company.address || "",
    state: company.state || "",
    pincode: company.pincode || "",
    email: company.email || "",
    gstin: company.gstin || "",
    // Format dates to YYYY-MM-DD for the input fields
    financialYearFrom: company.financialYearFrom.toISOString().split("T")[0],
    booksBeginFrom: company.booksBeginFrom.toISOString().split("T")[0],
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="text-blue-600" /> Edit Company
          </h1>
          <p className="text-slate-500 text-sm mt-1">{company.name}</p>
        </div>
        <Link
          href={`/companies/${companyId}`}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Form Container */}
      <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200">
        <EditCompanyForm
          initialCompany={initialCompanyData}
          // We pass the raw action; the form will include a hidden "id" field
          updateAction={updateCompany}
        />
      </div>
    </div>
  );
}
