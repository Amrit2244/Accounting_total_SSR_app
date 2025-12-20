import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/app/actions/company";
import { notFound } from "next/navigation";
import EditCompanyForm from "@/components/forms/EditCompanyForm";
import Link from "next/link";
import { Building2, ArrowLeft, ChevronRight } from "lucide-react";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return notFound();
  }

  const initialCompanyData = {
    id: company.id,
    name: company.name,
    address: company.address || "",
    state: company.state || "",
    pincode: company.pincode || "",
    email: company.email || "",
    gstin: company.gstin || "",
    // ✅ Formatted for <input type="date" />
    financialYearFrom: company.financialYearFrom.toISOString().split("T")[0],
    booksBeginFrom: company.booksBeginFrom.toISOString().split("T")[0],
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 font-sans animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={10} />
            <span className="text-slate-900">Configuration</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow-sm">
              <Building2 size={16} />
            </div>
            Edit Company Profile
          </h1>
        </div>
        <Link
          href={`/companies/${companyId}`}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <EditCompanyForm
          initialCompany={initialCompanyData}
          updateAction={updateCompany}
        />
      </div>
    </div>
  );
}
