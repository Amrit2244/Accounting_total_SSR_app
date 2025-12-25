"use client";

import { useState, useTransition } from "react";
import { Trash2, Edit, Save, X, Loader2, UserCog } from "lucide-react";
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">Username</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-slate-50/50 transition-colors"
            >
              <td className="px-6 py-4 font-mono text-slate-400">#{user.id}</td>

              {/* EDIT MODE vs VIEW MODE */}
              <td className="px-6 py-4">
                {editingId === user.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border border-blue-400 rounded px-2 py-1 outline-none text-slate-900 font-bold w-full max-w-[200px]"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <UserCog size={16} />
                    </div>
                    {user.username}
                    {user.username === "admin" && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                        Super Admin
                      </span>
                    )}
                  </div>
                )}
              </td>

              <td className="px-6 py-4 text-slate-500 text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {editingId === user.id ? (
                    <>
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={isPending}
                        className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                      >
                        {isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      {user.username !== "admin" && (
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="p-10 text-center text-slate-400 italic">
          No users found.
        </div>
      )}
    </div>
  );
}
