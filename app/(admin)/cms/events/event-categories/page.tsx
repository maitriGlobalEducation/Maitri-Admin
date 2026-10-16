"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

interface EventCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryForm {
  name: string;
  description: string;
}

const emptyForm: CategoryForm = {
  name: "",
  description: "",
};

const inputStyles =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";

export default function EventCategoriesPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cms/event-categories", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to load event categories.");
      }

      setCategories(result.categories);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load event categories.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setNotice("");
  };

  const startEditing = (category: EventCategory) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      description: category.description ?? "",
    });
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const url = editingId
        ? `/api/cms/event-categories/${editingId}`
        : "/api/cms/event-categories";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save event category.");
      }

      setNotice(result.message);
      setForm(emptyForm);
      setEditingId(null);

      await fetchCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save event category.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: EventCategory) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(category._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/cms/event-categories/${category._id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete event category.");
      }

      if (editingId === category._id) {
        resetForm();
      }

      setNotice(result.message);
      await fetchCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete event category.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50/70 p-6 lg:p-10">
      <div className="mx-auto max-w-[1560px] space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
              <FolderOpen size={16} />
              <span>CMS</span>
              <span>/</span>
              <span>Events</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Event Categories
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Create reusable categories for your events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchCategories()}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <p>{error || notice}</p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
              }}
              aria-label="Dismiss message"
              className="cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              {editingId ? "Edit category" : "Create a category"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {editingId
                ? "Update the category name or description."
                : "Add a category that can be selected when creating an event."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="event-category-name"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Category name <span className="text-red-500">*</span>
                </label>

                <input
                  id="event-category-name"
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Webinars"
                  className={inputStyles}
                />
              </div>

              <div>
                <label
                  htmlFor="event-category-description"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Description
                </label>

                <input
                  id="event-category-description"
                  maxLength={300}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="A short description (optional)"
                  className={inputStyles}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving || !form.name.trim()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : editingId ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}

                {isSaving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
            <div>
              <h2 className="font-semibold text-zinc-900">All categories</h2>

              <p className="mt-1 text-sm text-zinc-500">
                {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-zinc-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <FolderOpen size={22} />
              </div>

              <h3 className="font-medium text-zinc-900">No categories yet</h3>

              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Create your first event category using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-zinc-50/70 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600">
                      <FolderOpen size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-medium text-zinc-900">
                        {category.name}
                      </h3>

                      {category.description && (
                        <p className="mt-2 text-sm text-zinc-500">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(category)}
                      disabled={deletingId === category._id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === category._id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
