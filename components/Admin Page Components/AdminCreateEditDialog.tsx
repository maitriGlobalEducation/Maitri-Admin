"use client";

import { AdminAccount } from "@/app/(admin)/admin/page";
import { ADMIN_ROLE_OPTIONS } from "@/lib/permissions";
import { AdminRole } from "@/models/Admin";
import { X, KeyRound, LoaderCircle } from "lucide-react";

interface AdminCreateEditForm {
  username: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
}

interface AdminCreateEditDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editing: AdminAccount | null;
  saving: boolean;
  error: string;
  form: AdminCreateEditForm;
  setForm: React.Dispatch<React.SetStateAction<AdminCreateEditForm>>;
  saveAccount: (event: React.FormEvent<HTMLFormElement>) => void;
  ADMIN_ROLE_OPTIONS: typeof ADMIN_ROLE_OPTIONS;
}

export default function AdminCreateEditDialog({
  dialogOpen,
  setDialogOpen,
  editing,
  saving,
  error,
  form,
  setForm,
  saveAccount,
  ADMIN_ROLE_OPTIONS,
}: AdminCreateEditDialogProps) {
  if (!dialogOpen) return null;

  return (
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEAE1] bg-[#FDFCFA] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-[#172C3D]">
              {editing ? "Edit account" : "Create account"}
            </h2>
            <p className="mt-1 text-xs text-[#88857D]">
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

        {/* Form */}
        <div className="space-y-4 p-5 sm:p-6">
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
            <label className="mb-1.5 block text-xs font-medium text-[#52616B]">
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
              className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
            />

            <p className="mt-1.5 text-[11px] text-[#AAA69C]">
              Use 3–30 letters, numbers, dots, underscores, or hyphens.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#52616B]">
              {editing ? "New password (optional)" : "Password"}
            </label>

            <div className="relative">
              <KeyRound
                size={16}
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
                className="w-full rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] py-2.5 pl-9 pr-3 text-sm text-[#172C3D] outline-none transition placeholder:text-[#AAA69C] focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#52616B]">
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
              className="w-full cursor-pointer rounded-xl border border-[#E6E1D7] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#172C3D] outline-none transition focus:border-[#B9A477] focus:ring-2 focus:ring-[#EDE5D3]"
            >
              {ADMIN_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs leading-5 text-[#88857D]">
              {
                ADMIN_ROLE_OPTIONS.find((role) => role.value === form.role)
                  ?.description
              }
            </p>
          </div>

          {/* Account Status */}
          {editing && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E9E5DC] bg-[#FDFCFA] p-3 transition hover:border-[#D5C7A7]">
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

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-[#EEEAE1] bg-[#FDFCFA] px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className="cursor-pointer rounded-xl border border-[#E6E1D7] px-4 py-2 text-xs font-medium text-[#52616B] transition hover:bg-[#F8F6EF]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#172C3D] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#243F52] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}

            {saving ? "Saving..." : editing ? "Save changes" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
