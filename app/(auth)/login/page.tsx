"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { User, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc]">
      {/* LEFT SIDE: BRANDING (Blue Section - Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#003366] items-center justify-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 flex flex-col items-center text-center p-12">
          {/* Logo Container */}
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500">
            <Image
              src="/logo.png" // Ensure logo.png is in your public folder
              alt="Finacle Logo"
              width={160}
              height={160}
              className="drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            FINACLE ERP
          </h1>
          <p className="text-blue-200 text-lg max-w-md">
            Next-Generation Financial Accounting & Inventory Management System.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-[#003366] p-3 rounded-xl shadow-lg">
              <Image src="/logo.png" alt="Logo" width={60} height={60} />
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">
              Please sign in to your secure dashboard.
            </p>
          </div>

          <form action={action} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors">
                  <User size={18} />
                </div>
                <input
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#003366] focus:ring-4 ring-blue-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#003366] focus:ring-4 ring-blue-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {state.error}
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={isPending}
              className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer / Register Link */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-[#003366] font-bold hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
