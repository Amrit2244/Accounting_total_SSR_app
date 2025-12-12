import Sidebar from "@/components/Sidebar";
import { logout } from "@/app/actions/auth"; // Import the logout action

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Fixed Left) */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm shrink-0">
          {/* Left Side: Title or Breadcrumbs */}
          <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wider">
            Accounting Platform
          </h2>

          {/* Right Side: Actions & Profile */}
          <div className="flex items-center gap-4">
            {/* Logout Button (Server Action) */}
            <form action={logout}>
              <button className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded transition-colors border border-transparent hover:border-red-100">
                Logout
              </button>
            </form>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* User Avatar Placeholder */}
            <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
              U
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
