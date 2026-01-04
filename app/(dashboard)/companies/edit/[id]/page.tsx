import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/app/actions/company";
import { notFound } from "next/navigation";
import EditCompanyForm from "@/components/forms/EditCompanyForm";
import DeleteCompanyButton from "@/components/DeleteCompanyButton"; // 👈 Import the button
import Link from "next/link";
import { Building2, ArrowLeft, ChevronRight } from "lucide-react";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);

  // 1. Fetch Company Data
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return notFound();
  }

  // 2. CHECK FOR EXISTING VOUCHERS
  // We run a fast transaction to count everything associated with this company
  const counts = await prisma.$transaction([
    prisma.salesVoucher.count({ where: { companyId } }),
    prisma.purchaseVoucher.count({ where: { companyId } }),
    prisma.paymentVoucher.count({ where: { companyId } }),
    prisma.receiptVoucher.count({ where: { companyId } }),
    prisma.contraVoucher.count({ where: { companyId } }),
    prisma.journalVoucher.count({ where: { companyId } }),
    prisma.stockJournal.count({ where: { companyId } }),
  ]);

  // If the total is greater than 0, deletion is unsafe
  const totalVouchers = counts.reduce((acc, curr) => acc + curr, 0);
  const hasVouchers = totalVouchers > 0;

  const initialCompanyData = {
    id: company.id,
    name: company.name,
    address: company.address || "",
    state: company.state || "",
    pincode: company.pincode || "",
    email: company.email || "",
    gstin: company.gstin || "",
    financialYearFrom: company.financialYearFrom.toISOString().split("T")[0],
    booksBeginFrom: company.booksBeginFrom.toISOString().split("T")[0],
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 font-sans animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
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

      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative z-10">
        <EditCompanyForm
          initialCompany={initialCompanyData}
          updateAction={updateCompany}
        />
      </div>

      {/* DELETE SECTION (New) */}
      <DeleteCompanyButton companyId={companyId} hasVouchers={hasVouchers} />
    </div>
  );
}
