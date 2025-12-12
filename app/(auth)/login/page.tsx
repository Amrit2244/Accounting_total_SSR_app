"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-900 p-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-300 text-sm">
          Sign in to your accounting dashboard
        </p>
      </div>

      {/* Form Section */}
      <div className="p-8">
        <form action={action} className="space-y-5">
          {state?.error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-bold text-center">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg mt-2"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 font-medium">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-bold hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
