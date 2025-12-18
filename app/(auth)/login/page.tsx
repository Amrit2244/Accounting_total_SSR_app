"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { User, Lock, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    // FIX: Using h-screen and grid-cols-2 to force exact 50/50 split
    <div className="min-h-screen w-full grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* LEFT SIDE: Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative z-10 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-slate-500">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  name="username"
                  required
                  placeholder="johndoe"
                  className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md transition-colors flex items-center justify-center shadow-lg shadow-slate-900/20"
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Visual */}
      {/* FIX: relative and overflow-hidden prevent the blur circles from breaking layout */}
      <div className="hidden lg:flex relative bg-slate-900 flex-col justify-between p-12 text-white overflow-hidden h-full">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 font-bold text-xl">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
            <Sparkles size={20} className="text-blue-400" />
          </div>
          AS Core ERP SOLUTIONS
        </div>

        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-4">
            <p className="text-lg font-medium leading-relaxed text-slate-200">
              &quot;The most reliable ERP system we have ever used. It handles
              millions of transactions without a hitch.&quot;
            </p>
            <footer className="text-sm text-slate-400">
              — Enterprise Team
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
