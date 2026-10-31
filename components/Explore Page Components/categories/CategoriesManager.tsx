"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import type {
  ExploreCategory,
  ExploreCategoryInput,
  ExploreStatus,
} from "@/types/explore";

const emptyForm: ExploreCategoryInput = {
  title: "",
  slug: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  focusKeyword: "",
  sortOrder: 0,
  status: "draft",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<ExploreCategory[]>([]);
  const [form, setForm] = useState<ExploreCategoryInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExploreCategory | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [titleChangedSlug, setTitleChangedSlug] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/cms/explore/categories");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to fetch categories.");
      }

      setCategories(result.data);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch categories.");
      setError(message);
      toast.error(message);
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
    setTitleChangedSlug(false);
    setError("");
  };

  const updateField = <K extends keyof ExploreCategoryInput>(
    key: K,
    value: ExploreCategoryInput[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setForm((previous) => ({
      ...previous,
      title,
      ...(!titleChangedSlug ? { slug: slugify(title) } : {}),
      ...(!editingId && !previous.metaTitle.trim() ? { metaTitle: title } : {}),
    }));
  };

  const handleEdit = (category: ExploreCategory) => {
    setEditingId(category._id);
    setTitleChangedSlug(true);

    setForm({
      title: category.title,
      slug: category.slug,
      description: category.description ?? "",
      metaTitle: category.metaTitle ?? "",
      metaDescription: category.metaDescription ?? "",
      metaKeywords: category.metaKeywords ?? [],
      focusKeyword: category.focusKeyword ?? "",
      sortOrder: category.sortOrder ?? 0,
      status: category.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        slug: slugify(form.slug),
        description: form.description.trim(),
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        focusKeyword: form.focusKeyword.trim(),
      };

      if (!payload.title || !payload.slug) {
        throw new Error("Category title and slug are required.");
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
        throw new Error("Please enter a valid URL slug.");
      }

      const response = await fetch(
        editingId
          ? `/api/cms/explore/categories/${editingId}`
          : "/api/cms/explore/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save category.");
      }

      toast.success(
        editingId
          ? "Explore category updated successfully."
          : "Explore category created successfully.",
      );

      resetForm();
      await fetchCategories();
    } catch (error) {
      const message = getErrorMessage(error, "Failed to save category.");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/cms/explore/categories/${deleteTarget._id}`,
        { method: "DELETE" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete category.");
      }

      toast.success("Explore category deleted.");
      setDeleteTarget(null);

      if (editingId === deleteTarget._id) resetForm();

      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete category."));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  return (
    <div className="space-y-8">
      {/* Create / edit form */}
      <section>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {editingId ? "Edit Explore Category" : "Add Explore Category"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage category content displayed on the public Explore pages.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
            >
              <X size={15} />
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="category-title"
                className="text-sm font-medium text-zinc-700"
              >
                Category title *
              </label>
              <input
                id="category-title"
                required
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Art, Fashion & Design"
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10"
              />
            </div>

            <div>
              <label
                htmlFor="category-slug"
                className="text-sm font-medium text-zinc-700"
              >
                URL slug *
              </label>
              <div className="mt-1.5 flex items-center rounded-lg border border-zinc-200 focus-within:border-amber-600">
                <span className="pl-3 text-sm text-zinc-400">/institute/</span>
                <input
                  id="category-slug"
                  required
                  value={form.slug}
                  onChange={(event) => {
                    setTitleChangedSlug(true);
                    updateField("slug", slugify(event.target.value));
                  }}
                  placeholder="art-fashion-design"
                  className="min-w-0 flex-1 rounded-r-lg px-2 py-3 text-sm outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">
                Use lowercase letters, numbers, and hyphens.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="text-sm font-medium text-zinc-700"
            >
              Introduction paragraph
            </label>
            <textarea
              id="category-description"
              rows={7}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Enter the category introduction shown above the institute logos..."
              className="mt-1.5 w-full resize-y rounded-lg border border-zinc-200 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="category-meta-title"
                className="text-sm font-medium text-zinc-700"
              >
                SEO title
              </label>
              <input
                id="category-meta-title"
                value={form.metaTitle}
                onChange={(event) =>
                  updateField("metaTitle", event.target.value)
                }
                placeholder="Art, Fashion & Design | Maitri"
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label
                htmlFor="category-focus-keyword"
                className="text-sm font-medium text-zinc-700"
              >
                Focus keyword
              </label>
              <input
                id="category-focus-keyword"
                value={form.focusKeyword}
                onChange={(event) =>
                  updateField("focusKeyword", event.target.value)
                }
                placeholder="Fashion design colleges"
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="category-meta-description"
              className="text-sm font-medium text-zinc-700"
            >
              SEO meta description
            </label>
            <textarea
              id="category-meta-description"
              rows={3}
              value={form.metaDescription}
              onChange={(event) =>
                updateField("metaDescription", event.target.value)
              }
              className="mt-1.5 w-full resize-y rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label
              htmlFor="category-meta-keywords"
              className="text-sm font-medium text-zinc-700"
            >
              SEO keywords
            </label>
            <input
              id="category-meta-keywords"
              value={form.metaKeywords.join(", ")}
              onChange={(event) =>
                updateField(
                  "metaKeywords",
                  event.target.value
                    .split(",")
                    .map((keyword) => keyword.trim())
                    .filter(Boolean),
                )
              }
              placeholder="fashion design, art colleges, design schools"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-amber-600"
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              Separate keywords with commas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-sort-order"
                className="text-sm font-medium text-zinc-700"
              >
                Display order
              </label>
              <input
                id="category-sort-order"
                type="number"
                min={0}
                step={1}
                value={form.sortOrder}
                onChange={(event) =>
                  updateField("sortOrder", Number(event.target.value))
                }
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-amber-600"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Lower numbers appear first.
              </p>
            </div>

            <div>
              <label
                htmlFor="category-status"
                className="text-sm font-medium text-zinc-700"
              >
                Publication status
              </label>
              <select
                id="category-status"
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as ExploreStatus)
                }
                className="mt-1.5 w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-amber-600"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="cursor-pointer rounded-lg border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </section>

      {/* Categories list */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Explore Categories
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage category pages and their publication status.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            Loading Explore categories...
          </div>
        ) : error && categories.length === 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
            {error}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void fetchCategories()}
                className="cursor-pointer rounded-lg border border-red-200 bg-white px-4 py-2 font-medium hover:bg-red-50"
              >
                Try again
              </button>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No Explore categories yet
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Create your first category using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    {["Category", "Order", "Status", "Updated", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="max-w-md px-5 py-4">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {category.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-400">
                          /institute/{category.slug}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-zinc-600">
                        {category.sortOrder}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                            category.status === "published"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-500">
                        {formatDate(category.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            title="Edit category"
                            aria-label={`Edit ${category.title}`}
                            className="cursor-pointer rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(category)}
                            title="Delete category"
                            aria-label={`Delete ${category.title}`}
                            className="cursor-pointer rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
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
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3
              id="delete-category-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Delete Explore category?
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will permanently delete{" "}
              <span className="font-medium text-zinc-700">
                {deleteTarget.title}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
