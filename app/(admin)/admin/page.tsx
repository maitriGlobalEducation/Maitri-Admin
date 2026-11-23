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
import { ADMIN_ROLE_OPTIONS, ROLE_STYLES } from "@/lib/permissions";
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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E9E1CF] bg-[#F0EBDD] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#80683D]">
              <ShieldCheck size={15} />
              ACCESS CONTROL
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#172C3D]">
              Admin management
            </h1>

            <p className="mt-2 text-sm text-[#77766F]">
              Manage CMS and CRM accounts, roles, passwords, and access.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172C3D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243F52]"
          >
            <Plus size={18} />
            Add account
          </button>
        </div>

        {/* Alerts */}
        {error && !dialogOpen && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-[#FFF7F5] px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center justify-between mb-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-medium text-sm text-emerald-500"
          >
            <span>{success}</span>
            <button className="cursor-pointer" onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Accounts Section */}
        <section className="overflow-hidden rounded-2xl border border-[#E9E5DC] bg-white shadow-[0_2px_12px_rgba(23,44,61,0.04)]">
          {/* Section Header */}
          <div className="flex flex-col gap-4 border-b border-[#EEEAE1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold text-[#172C3D]">User accounts</h2>
              <p className="mt-1 text-sm text-[#88857D]">
                {admins.length} total account{admins.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA69C]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or role"
                className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] py-2.5 pl-9 pr-3 text-sm text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#88857D]">
              <LoaderCircle size={20} className="animate-spin text-[#B9A477]" />
              Loading accounts...
            </div>
          ) : filteredAdmins.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#F0EBDD] text-[#9A8150]">
                <UserRound size={27} />
              </div>
              <p className="font-medium text-[#172C3D]">No accounts found</p>
              <p className="mt-1 text-sm text-[#88857D]">
                Try another search or create a new account.
              </p>
            </div>
          ) : (
            /* Accounts Table */
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-[#f8f7f2] text-xs uppercase tracking-wide text-[#817D72]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Username</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0EDE6]">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="transition hover:bg-[#FCFBF8]"
                    >
                      {/* Username */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E9E1CF] bg-[#F0EBDD] font-semibold text-[#80683D]">
                            {admin.username.charAt(0).toUpperCase()}
                          </div>

                          <span className="font-medium text-[#172C3D]">
                            {admin.username}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                            ROLE_STYLES[admin.role]
                          }`}
                        >
                          {roleLabels[admin.role]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-medium ${
                            admin.isActive
                              ? "text-emerald-700"
                              : "text-[#88857D]"
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full ${
                              admin.isActive ? "bg-emerald-500" : "bg-[#C9C5BB]"
                            }`}
                          />
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 text-[#88857D]">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Edit account"
                            onClick={() => openEdit(admin)}
                            className="cursor-pointer rounded-lg border border-[#E6E1D7] bg-white p-2 text-[#52616B] transition hover:border-[#D5C7A7] hover:bg-[#F8F6EF] hover:text-[#172C3D]"
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
                            className="cursor-pointer rounded-lg border border-[#E6E1D7] bg-white px-3 py-2 text-xs font-medium text-[#52616B] transition hover:border-[#D5C7A7] hover:bg-[#F8F6EF] hover:text-[#172C3D]"
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            title="Delete account"
                            onClick={() => setDeleteTarget(admin)}
                            className="cursor-pointer rounded-lg border border-red-100 bg-white p-2 text-red-600 transition hover:bg-red-50"
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

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDialogOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#172C3D]/40 p-4 backdrop-blur-[3px]"
        >
          <form
            onSubmit={saveAccount}
            onMouseDown={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#E9E5DC] bg-white shadow-2xl"
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between border-b border-[#EEEAE1] bg-[#FDFCFA] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#172C3D]">
                  {editing ? "Edit account" : "Create account"}
                </h2>
                <p className="mt-1 text-sm text-[#88857D]">
                  Configure the username and access level.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-[#77766F] transition hover:bg-[#F0EBDD] hover:text-[#172C3D]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog Form */}
            <div className="space-y-5 p-6">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-100 bg-[#FFF7F5] px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#52616B]">
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
                  className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] px-3.5 py-3 text-sm text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
                />

                <p className="mt-1.5 text-xs text-[#AAA69C]">
                  Use 3–30 letters, numbers, dots, underscores, or hyphens.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#52616B]">
                  {editing ? "New password (optional)" : "Password"}
                </label>

                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA69C]"
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
                    className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] py-3 pl-10 pr-3 text-sm text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#52616B]">
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
                  className="w-full cursor-pointer rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] px-3.5 py-3 text-sm text-[#172C3D] outline-none transition focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
                >
                  {ADMIN_ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-[#88857D]">
                  {
                    ADMIN_ROLE_OPTIONS.find((role) => role.value === form.role)
                      ?.description
                  }
                </p>
              </div>

              {/* Account Status */}
              {editing && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E9E5DC] bg-[#FDFCFA] p-3.5 transition hover:border-[#D5C7A7]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({ ...form, isActive: event.target.checked })
                    }
                    className="size-4 cursor-pointer accent-[#172C3D]"
                  />

                  <span>
                    <span className="block text-sm font-medium text-[#172C3D]">
                      Account active
                    </span>
                    <span className="mt-0.5 block text-xs text-[#88857D]">
                      Inactive accounts cannot sign in.
                    </span>
                  </span>
                </label>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end gap-3 border-t border-[#EEEAE1] bg-[#FDFCFA] px-6 py-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="cursor-pointer rounded-xl border border-[#E6E1D7] px-4 py-2.5 text-sm font-medium text-[#52616B] transition hover:bg-[#F8F6EF]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#172C3D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243F52] disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
              setError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#172C3D]/40 p-4 backdrop-blur-[3px]"
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#E9E5DC] bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h2 className="text-lg font-semibold text-[#172C3D]">
              Delete {deleteTarget.username}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#77766F]">
              This permanently removes the account. The person will no longer be
              able to sign in. This action cannot be undone.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-xl border border-[#E6E1D7] px-4 py-2.5 text-sm font-medium text-[#52616B] transition hover:bg-[#F8F6EF]"
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
