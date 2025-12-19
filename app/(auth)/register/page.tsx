"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";
import { User, Lock, Mail, Loader2, ArrowRight, Activity } from "lucide-react";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined);

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* LEFT SIDE: Visual (Dark Theme) */}
      <div className="hidden lg:flex relative bg-[#0f172a] flex-col justify-between p-8 text-white overflow-hidden h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-tight">
          <Activity className="text-blue-500" size={16} /> AS Core ERP
        </div>

        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-4 tracking-tight">
            Start your journey.
          </h2>
          <ul className="space-y-3 text-slate-300">
            {[
              "Real-time analytics",
              "Automated inventory",
              "Enterprise security",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-slate-500 text-[10px] relative z-10 uppercase tracking-widest font-bold">
          © 2025 AS Core ERP SOLUTIONS.
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative z-10 bg-white">
        <div className="w-full max-w-[320px] space-y-4">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create an account
            </h1>
            <p className="text-xs text-slate-500">Enter your details below.</p>
          </div>

          <form action={action} className="space-y-3">
            {state?.error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-2 rounded border border-red-100 uppercase tracking-tighter">
                {state.error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={14} />
                </div>
                <input
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full h-9 pl-9 pr-3 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={14} />
                </div>
                <input
                  name="username"
                  required
                  placeholder="johndoe"
                  className="w-full h-9 pl-9 pr-3 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-9 pl-9 pr-3 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>
                  CREATE ACCOUNT <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
