"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  Pencil,
  Trash2,
  KeyRound,
  UserRound,
  X,
  LoaderCircle,
} from "lucide-react";
import { ADMIN_ROLE_OPTIONS } from "@/lib/permissions";
import type { AdminRole } from "@/models/Admin";

type AdminAccount = {
  id: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
};

type AccountForm = {
  username: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
};

const emptyForm: AccountForm = {
  username: "",
  password: "",
  role: "EDITOR",
  isActive: true,
};

const roleLabels: Record<AdminRole, string> = {
  COUNSELLOR: "Counsellor",
  EDITOR: "Editor",
  MANAGER: "Manager",
  SUPER_ADMIN: "Super Admin",
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admins", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load admin accounts.");
      }

      setAdmins(data.admins);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load admin accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setDialogOpen(true);
  }

  function openEdit(admin: AdminAccount) {
    setEditing(admin);
    setForm({
      username: admin.username,
      password: "",
      role: admin.role,
      isActive: admin.isActive,
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  }

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        role: form.role,
        isActive: form.isActive,
      };

      if (!editing || form.password) {
        payload.password = form.password;
      }

      const response = await fetch(
        editing ? `/api/admins/${editing.id}` : "/api/admins",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save the account.");
      }

      setDialogOpen(false);
      setSuccess(data.message || "Account saved successfully.");
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save the account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(admin: AdminAccount) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update account status.");
      }

      setSuccess(data.message);
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update account.",
      );
    }
  }

  async function deleteAccount() {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admins/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete the account.");
      }

      setDeleteTarget(null);
      setSuccess(data.message);
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete account.",
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredAdmins = admins.filter((admin) => {
    const query = search.trim().toLowerCase();

    return (
      admin.username.toLowerCase().includes(query) ||
      roleLabels[admin.role].toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
              <ShieldCheck size={16} />
              Access control
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              Admin management
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Manage CMS and CRM accounts, roles, passwords, and access.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            <Plus size={18} />
            Add account
          </button>
        </div>

        {error && !dialogOpen && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold text-zinc-900">User accounts</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {admins.length} total account{admins.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or role"
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-zinc-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading accounts...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <UserRound size={30} className="mb-3 text-zinc-300" />
              <p className="font-medium text-zinc-800">No accounts found</p>
              <p className="mt-1 text-sm text-zinc-500">
                Try another search or create a new account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Username</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Created</th>
                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="transition hover:bg-zinc-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-semibold text-zinc-700">
                            {admin.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-zinc-900">
                            {admin.username}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700">
                          {roleLabels[admin.role]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-medium ${
                            admin.isActive
                              ? "text-emerald-700"
                              : "text-zinc-500"
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full ${
                              admin.isActive ? "bg-emerald-500" : "bg-zinc-300"
                            }`}
                          />
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-zinc-500">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Edit account"
                            onClick={() => openEdit(admin)}
                            className="cursor-pointer rounded-lg border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={
                              admin.isActive
                                ? "Deactivate account"
                                : "Activate account"
                            }
                            onClick={() => void toggleStatus(admin)}
                            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            title="Delete account"
                            onClick={() => setDeleteTarget(admin)}
                            className="cursor-pointer rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {dialogOpen && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDialogOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/40 p-4 backdrop-blur-[2px]"
        >
          <form
            onSubmit={saveAccount}
            onMouseDown={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  {editing ? "Edit account" : "Create account"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Configure the username and access level.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Username
                </label>
                <input
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9._-]+"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  placeholder="e.g. amit.sharma"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Use 3–30 letters, numbers, dots, underscores, or hyphens.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  {editing ? "New password (optional)" : "Password"}
                </label>
                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="password"
                    required={!editing}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    placeholder={
                      editing
                        ? "Leave blank to keep current password"
                        : "At least 8 characters"
                    }
                    className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as AdminRole,
                    })
                  }
                  className="w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                >
                  {ADMIN_ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {
                    ADMIN_ROLE_OPTIONS.find((role) => role.value === form.role)
                      ?.description
                  }
                </p>
              </div>

              {editing && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3.5">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({ ...form, isActive: event.target.checked })
                    }
                    className="size-4 cursor-pointer accent-zinc-900"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-800">
                      Account active
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      Inactive accounts cannot sign in.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="cursor-pointer rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
              setError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Delete {deleteTarget.username}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              This permanently removes the account. The person will no longer be
              able to sign in. This action cannot be undone.
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={saving}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
