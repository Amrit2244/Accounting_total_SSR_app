import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/app/actions/company";
import { notFound } from "next/navigation";
import EditCompanyForm from "@/components/forms/EditCompanyForm";
import Link from "next/link";
import { Building2, ArrowLeft, ChevronRight, Settings } from "lucide-react";

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
  const initialCompanyData = {
    id: company.id,
    name: company.name,
    address: company.address || "",
    state: company.state || "",
    pincode: company.pincode || "",
    email: company.email || "",
    gstin: company.gstin || "",
    // Format dates to YYYY-MM-DD for HTML input[type="date"]
    financialYearFrom: company.financialYearFrom.toISOString().split("T")[0],
    booksBeginFrom: company.booksBeginFrom.toISOString().split("T")[0],
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}`}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Settings size={22} className="text-indigo-600" />
                Company Settings
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-slate-900">Edit Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />

          <div className="p-1">
            <EditCompanyForm
              initialCompany={initialCompanyData}
              updateAction={updateCompany}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
