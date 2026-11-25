"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  Pencil,
  Trash2,
  UserRound,
  X,
  LoaderCircle,
} from "lucide-react";
import { ADMIN_ROLE_OPTIONS, ROLE_STYLES } from "@/lib/permissions";
import type { AdminRole } from "@/models/Admin";
import AdminCreateEditDialog from "@/components/Admin Page Components/AdminCreateEditDialog";

export type AdminAccount = {
  id: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
};

export type AccountForm = {
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

            <h1 className="text-2xl font-bold tracking-tight text-[#172C3D]">
              Admin management
            </h1>

            <p className="mt-2 text-sm text-[#77766F]">
              Manage CMS and CRM accounts, roles, passwords, and access.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172C3D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#243F52]"
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
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-[#EEEAE1] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#172C3D]">
                User accounts
              </h2>
              <p className="mt-0.5 text-xs text-[#88857D]">
                {admins.length} total account{admins.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-65">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA69C]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or role..."
                className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] py-2 pl-9 pr-3 text-xs text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#C6AD72] focus:bg-white focus:ring-2 focus:ring-[#EDE5D3]/70"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2.5 text-sm text-[#88857D]">
              <LoaderCircle size={18} className="animate-spin text-[#B9A477]" />
              Loading accounts...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[#F0EBDD] text-[#9A8150]">
                <UserRound size={23} />
              </div>
              <p className="text-sm font-semibold text-[#172C3D]">
                No accounts found
              </p>
              <p className="mt-1 text-xs text-[#88857D]">
                Try another search or create a new account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left text-sm">
                <thead className="bg-[#FAF9F5] text-[10px] uppercase tracking-[0.08em] text-[#88857D]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Username</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0EDE6]">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="group transition-colors duration-150 hover:bg-[#FBF8EF]"
                    >
                      {/* Username */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E9E1CF] bg-[#F5F0E4] text-sm font-semibold text-[#80683D] transition-colors group-hover:border-[#E6D7AD] group-hover:bg-[#F0E4C4]">
                            {admin.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[#172C3D]">
                            {admin.username}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                            ROLE_STYLES[admin.role]
                          }`}
                        >
                          {roleLabels[admin.role]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-medium ${
                            admin.isActive
                              ? "text-emerald-700"
                              : "text-[#88857D]"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              admin.isActive ? "bg-emerald-500" : "bg-[#C9C5BB]"
                            }`}
                          />
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-3 text-xs text-[#88857D]">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit account"
                            onClick={() => openEdit(admin)}
                            className="cursor-pointer rounded-lg border border-transparent p-2 text-[#68747B] transition hover:border-[#E9DDBE] hover:bg-[#F3EBD8] hover:text-[#80683D]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title={
                              admin.isActive
                                ? "Deactivate account"
                                : "Activate account"
                            }
                            onClick={() => void toggleStatus(admin)}
                            className="cursor-pointer rounded-lg border border-transparent px-2.5 py-2 text-[11px] font-medium text-[#68747B] transition hover:border-[#E9DDBE] hover:bg-[#F3EBD8] hover:text-[#80683D]"
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            title="Delete account"
                            onClick={() => setDeleteTarget(admin)}
                            className="cursor-pointer rounded-lg border border-transparent p-2 text-[#A1A09A] transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
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
        <AdminCreateEditDialog
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          editing={editing}
          saving={saving}
          error={error}
          form={form}
          setForm={setForm}
          saveAccount={saveAccount}
          ADMIN_ROLE_OPTIONS={ADMIN_ROLE_OPTIONS}
        />
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
