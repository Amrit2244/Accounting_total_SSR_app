"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { User, Lock, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* LEFT SIDE: Form */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative z-10 bg-white">
        <div className="w-full max-w-[320px] space-y-4">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Welcome back
            </h1>
            <p className="text-xs text-slate-500">
              Enter credentials to access workspace.
            </p>
          </div>

          <form action={action} className="space-y-3">
            {state?.error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-2 rounded flex items-center gap-2 border border-red-100 uppercase tracking-tighter">
                <AlertCircle size={14} /> {state.error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={14} />
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
              <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
                >
                  Forgot?
                </Link>
              </div>
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
              className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded transition-colors flex items-center justify-center shadow-sm mt-2"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Visual */}
      <div className="hidden lg:flex relative bg-slate-900 flex-col justify-between p-8 text-white overflow-hidden h-full">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-widest uppercase">
          <div className="p-1.5 bg-white/10 rounded backdrop-blur-sm border border-white/10">
            <Sparkles size={16} className="text-blue-400" />
          </div>
          AS Core ERP SOLUTIONS
        </div>

        <div className="relative z-10 max-w-sm">
          <blockquote className="space-y-2">
            <p className="text-sm font-medium leading-relaxed text-slate-200 italic">
              &quot;The most reliable ERP system we have ever used. It handles
              millions of transactions without a hitch.&quot;
            </p>
            <footer className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              — Enterprise Team
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
