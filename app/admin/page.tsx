import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/admin/UserManagement";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { getAllUsers } from "@/app/actions/admin";
import { jwtVerify } from "jose"; // ⚠️ Essential for decoding your session

// --- CONFIGURATION (Must match auth.ts) ---
const secretKey =
  process.env.SESSION_SECRET || "your-super-secret-key-change-this";
const encodedKey = new TextEncoder().encode(secretKey);

export default async function AdminPage() {
  // --- 🔒 SECURITY CHECK START ---

  // 1. Get the session cookie
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    redirect("/login");
  }

  let userId: number | null = null;

  // 2. Verify & Decode the JWT
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    // In auth.ts you stored it as: { userId: string }
    if (payload.userId) {
      userId = parseInt(payload.userId as string);
    }
  } catch (error) {
    // If token is tampered with or expired, force logout
    console.error("Invalid Admin Session:", error);
    redirect("/login");
  }

  if (!userId) {
    redirect("/login");
  }

  // 3. Verify against the database
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  // 4. The FINAL Check: Is this user actually "admin"?
  if (currentUser?.username !== "admin") {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-rose-600 gap-4 bg-slate-50">
        <ShieldAlert size={64} />
        <h1 className="text-3xl font-black uppercase tracking-tight">
          Access Denied
        </h1>
        <p className="text-slate-500 font-medium">
          You do not have permission to view this page.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  // --- 🔒 SECURITY CHECK END ---

  // 5. Fetch Data for the Admin Table
  const { data: users, success } = await getAllUsers();

  if (!success)
    return <div className="p-10 text-center">Error loading users.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                Super User Area
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-slate-500 font-medium">
              Manage system access, edit usernames, or remove accounts.
            </p>
          </div>
          <Link
            href="/" // Changed to "/" as per your login redirect
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Client Component for Table */}
        <UserManagement users={users || []} />
      </div>
    </div>
  );
}
