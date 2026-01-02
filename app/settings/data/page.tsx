import { prisma } from "@/lib/prisma";
import DataManagementUI from "./DataManagementUI";

// Force dynamic so logs update on every visit
export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  const logs = await prisma.dataActivityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 15,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Data Management
        </h1>
        <p className="text-gray-600">
          Manage your database backups and system restoration.
        </p>
      </div>

      <DataManagementUI initialLogs={logs} />
    </div>
  );
}
