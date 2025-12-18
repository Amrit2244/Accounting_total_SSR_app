"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";
import { User, Lock, Mail, Loader2, ArrowRight, Activity } from "lucide-react";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined);

  return (
    // FIX: Using h-screen and grid-cols-2
    <div className="min-h-screen w-full grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* LEFT SIDE: Visual (Dark Theme) */}
      <div className="hidden lg:flex relative bg-[#0f172a] flex-col justify-between p-12 text-white overflow-hidden h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 font-bold text-xl">
          <Activity className="text-blue-500" /> AS Core ERP
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6">Start your journey.</h2>
          <ul className="space-y-4 text-slate-300">
            {[
              "Real-time analytics",
              "Automated inventory",
              "Enterprise security",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-slate-500 text-xs relative z-10">
          © 2025 AS Core ERP SOLUTIONS.
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative z-10 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Create an account
            </h1>
            <p className="text-slate-500">Enter your details below.</p>
          </div>

          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  name="username"
                  required
                  placeholder="johndoe"
                  className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
