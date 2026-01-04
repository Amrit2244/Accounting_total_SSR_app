import { getCashBookReport } from "@/app/actions/reports";
import CashBookClient from "@/components/reports/CashBookClient";

export const dynamic = "force-dynamic";

export default async function CashBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerId?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const companyId = parseInt(id);

  // Default to current month if no dates selected
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const fromDate = q.from ? new Date(q.from) : firstDay;
  const toDate = q.to ? new Date(q.to) : today;
  // Set end date to end of day
  toDate.setHours(23, 59, 59, 999);

  const ledgerId = q.ledgerId ? parseInt(q.ledgerId) : undefined;

  const data = await getCashBookReport(companyId, ledgerId, fromDate, toDate);

  return <CashBookClient data={data} companyId={companyId} searchParams={q} />;
}
