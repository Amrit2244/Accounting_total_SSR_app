"use client";

import { useActionState } from "react";
import { createCompany } from "@/app/actions/company";
import Link from "next/link";

export default function CreateCompanyPage() {
  const [state, action, isPending] = useActionState(createCompany, undefined);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-300 mt-10">
      <h1 className="text-2xl font-extrabold mb-6 text-black">
        Create New Company
      </h1>

      {state?.error && (
        <div className="bg-red-100 text-red-900 font-medium p-3 rounded mb-6 text-sm border border-red-200">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        {/* Name Section */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Company Name
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full border border-gray-400 p-2 rounded text-black focus:ring-2 focus:ring-black outline-none bg-gray-50"
            placeholder="e.g. ABC Pvt Ltd"
          />
        </div>

        {/* Address Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Mailing Address
            </label>
            <textarea
              name="address"
              rows={2}
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
              placeholder="Street, Area, Building"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              State
            </label>
            <input
              name="state"
              type="text"
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
              placeholder="e.g. Maharashtra"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Pincode
            </label>
            <input
              name="pincode"
              type="text"
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
        </div>

        {/* Contact & Tax */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              GSTIN / Tax No
            </label>
            <input
              name="gstin"
              type="text"
              className="w-full border border-gray-400 p-2 rounded text-black bg-gray-50"
              placeholder="27ABCDE1234F1Z5"
            />
          </div>
        </div>

        {/* Fiscal Year Section (Crucial for Tally) */}
        <div className="bg-gray-100 p-4 rounded-lg grid grid-cols-2 gap-6 border border-gray-300">
          <div>
            <label className="block text-sm font-extrabold text-black mb-1">
              Financial Year From
            </label>
            <input
              name="financialYearFrom"
              type="date"
              defaultValue={new Date().getFullYear() + "-04-01"}
              required
              className="w-full border border-gray-400 p-2 rounded text-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-extrabold text-black mb-1">
              Books Beginning From
            </label>
            <input
              name="booksBeginFrom"
              type="date"
              defaultValue={new Date().getFullYear() + "-04-01"}
              required
              className="w-full border border-gray-400 p-2 rounded text-black bg-white"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/"
            className="px-6 py-2 border border-gray-400 rounded text-black font-bold hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            disabled={isPending}
            type="submit"
            className="flex-1 bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Save Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
