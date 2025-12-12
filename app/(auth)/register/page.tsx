"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        action={action}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Create Account
        </h2>
        {state?.error && (
          <div className="bg-red-100 text-red-600  rounded mb-4 text-sm">
            {state.error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-black">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            className="w-full border p-2 rounded border-t-green-500 text-black"
            placeholder="Optional"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-black">
            Username
          </label>
          <input
            type="text"
            name="username"
            required
            className="w-full p-2 rounded border-t-red-400   border text-black"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-black">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full  p-2  rounded border-t-red-400   border text-black"
          />
        </div>
        <button
          disabled={isPending}
          className="w-full bg-green-600 text-white h-10 rounded hover:bg-green-700 disabled: opacity-50 "
        >
          {isPending ? "Creating..." : "Register"}
        </button>
        <p className="mt-4 text-center text-sm text-cyan-800">
          Have an account?
          <Link href="/login" className="text-red-800 ">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
