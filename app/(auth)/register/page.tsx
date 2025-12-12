"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
      <div className="bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-slate-300 text-sm">
          Join to start managing your finances
        </p>
      </div>

      <div className="p-8">
        <form action={action} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-bold text-center">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="johndoe"
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
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={isPending}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-lg transition-all mt-4 shadow-md"
          >
            {isPending ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 font-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
