"use client";

import { useState, useTransition } from "react";
import {
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  UserCog,
  User,
  ShieldCheck,
} from "lucide-react";
import { updateUser, deleteUser } from "@/app/actions/admin";

export default function UserManagement({ users }: { users: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleEditClick = (user: any) => {
    setEditingId(user.id);
    setEditName(user.username);
  };

  const handleSave = async (id: number) => {
    startTransition(async () => {
      const res = await updateUser(id, editName);
      if (res.success) setEditingId(null);
      else alert(res.error);
    });
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    startTransition(async () => {
      const res = await deleteUser(id);
      if (!res.success) alert(res.error);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 w-20">ID</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 w-40">Created On</th>
              <th className="px-6 py-4 text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">
                    No users found.
                  </p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`group transition-colors ${
                    editingId === user.id
                      ? "bg-indigo-50/30"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                    #{user.id.toString().padStart(3, "0")}
                  </td>

                  {/* EDIT MODE vs VIEW MODE */}
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                          <UserCog size={16} />
                        </div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 px-3 rounded-lg border border-indigo-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full max-w-[200px] shadow-sm transition-all"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                            user.username === "admin"
                              ? "bg-rose-500"
                              : "bg-slate-400"
                          }`}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">
                          {user.username}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {user.username === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-rose-100 tracking-wider">
                        <ShieldCheck size={12} /> Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase px-2 py-1 rounded border border-slate-200 tracking-wider">
                        <User size={12} /> Standard User
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-500 text-xs font-mono font-medium">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={isPending}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70"
                            title="Save Changes"
                          >
                            {isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-colors shadow-sm"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-colors shadow-sm"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          {user.username !== "admin" && (
                            <button
                              onClick={() =>
                                handleDelete(user.id, user.username)
                              }
                              className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-colors shadow-sm"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
