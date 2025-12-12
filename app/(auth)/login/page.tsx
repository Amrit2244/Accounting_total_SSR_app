"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        action={action}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-800">
          Login
        </h2>

        {state?.error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {state.error}
          </div>
        )}

        <div className="mb-4">
          {/* ✅ FIX: Wrap input inside label to fix SonarLint warning */}
          <label className="block text-sm  mb-1 text-black font-semibold">
            Username
            <input
              name="username"
              type="text"
              required
              className="w-full border p-2 rounded mt-1"
            />
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-black">
            Password
            <input
              name="password"
              type="password"
              required
              className="w-full border p-2 rounded mt-1"
            />
          </label>
        </div>

        <button
          disabled={isPending}
          className="w-full bg-cyan-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-red-800 font-semibold ">
          No account?{" "}
          <Link href="/register" className="text-teal-600 font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
