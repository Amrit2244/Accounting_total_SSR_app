import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/admin/UserManagement";
import {
  ArrowLeft,
  ShieldAlert,
  Users,
  ChevronRight,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { getAllUsers } from "@/app/actions/admin";
import { jwtVerify } from "jose";

// --- CONFIGURATION ---
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
    if (payload.userId) {
      userId = parseInt(payload.userId as string);
    }
  } catch (error) {
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
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div
          className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 bg-white border border-slate-200 p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <ShieldAlert size={40} className="text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Access Denied
          </h1>
          <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
            This area is restricted to super administrators only. Your account
            permissions do not allow access to this page.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
          >
            <ArrowLeft size={16} /> Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // --- 🔒 SECURITY CHECK END ---

  // 5. Fetch Data for the Admin Table
  const { data: users, success } = await getAllUsers();

  if (!success)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-500 font-bold">
          Error loading users. Please try again.
        </div>
      </div>
    );

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

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                  <Lock size={10} /> Super User Area
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <Users size={22} className="text-indigo-600" />
                User Management
              </h1>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Link
                  href="/"
                  className="hover:text-indigo-600 transition-colors"
                >
                  Home
                </Link>
                <ChevronRight size={10} />
                <span className="text-slate-900">Admin Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden relative min-h-[500px]">
          {/* Decorative top strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-rose-500" />

          <div className="p-1">
            <UserManagement users={users || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
