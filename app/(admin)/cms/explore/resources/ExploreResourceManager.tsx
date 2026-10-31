"use client";

import MediaUploader from "@/components/cms/MediaUploader";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { uploadImage } from "@/services/media.service";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type ResourceKind = "campuses" | "course-categories" | "areas" | "brands";

type InstituteOption = {
  _id: string;
  name: string;
};

type Resource = {
  _id: string;
  name: string;
  city?: string;
  country?: string;
  image?: { url?: string; publicId?: string } | null;
  institute?: string | InstituteOption;
};

const resourceLabel: Record<ResourceKind, string> = {
  campuses: "campus",
  "course-categories": "course category",
  areas: "area",
  brands: "brand",
};

type FormState = {
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  publicId: string;
  institute: string;
};

const blankForm: FormState = {
  name: "",
  city: "",
  country: "",
  imageUrl: "",
  publicId: "",
  institute: "",
};

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

const config: Record<
  ResourceKind,
  {
    title: string;
    description: string;
    endpoint: string;
    responseKey: string;
    hasImage: boolean;
    hasLocation: boolean;
    hasInstitute: boolean;
  }
> = {
  campuses: {
    title: "Campus Management",
    description: "Add and manage campuses and their locations.",
    endpoint: "/api/cms/explore/campuses",
    responseKey: "campuses",
    hasImage: true,
    hasLocation: true,
    hasInstitute: false,
  },
  "course-categories": {
    title: "Course Category Management",
    description: "Create and manage course categories.",
    endpoint: "/api/cms/explore/course-categories",
    responseKey: "courseCategories",
    hasImage: false,
    hasLocation: false,
    hasInstitute: false,
  },
  areas: {
    title: "Area Management",
    description: "Manage areas and their images.",
    endpoint: "/api/cms/explore/areas",
    responseKey: "areas",
    hasImage: true,
    hasLocation: false,
    hasInstitute: false,
  },
  brands: {
    title: "Brand Management",
    description: "Add and manage Explore brands and their images.",
    endpoint: "/api/cms/explore/brands",
    responseKey: "brands",
    hasImage: true,
    hasLocation: false,
    hasInstitute: false,
  },
};

export default function ExploreResourceManager({
  kind,
}: {
  kind: ResourceKind;
}) {
  const settings = config[kind];

  const [items, setItems] = useState<Resource[]>([]);
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [itemToDelete, setItemToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [uploadError, setUploadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      const searchableValues = [
        item.name,
        item.city,
        item.country,
        settings.hasInstitute ? getInstituteName(item) : "",
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [items, searchQuery, settings.hasInstitute]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [fetch(settings.endpoint)];

      if (settings.hasInstitute) {
        requests.push(fetch("/api/cms/explore/institutes"));
      }

      const responses = await Promise.all(requests);
      const results = await Promise.all(
        responses.map(async (response) => ({
          ok: response.ok,
          body: await response.json(),
        })),
      );

      if (!results[0].ok) {
        throw new Error(results[0].body.message || "Failed to load records.");
      }

      setItems(results[0].body[settings.responseKey] ?? []);

      if (settings.hasInstitute && results[1]) {
        if (!results[1].ok) {
          throw new Error(
            results[1].body.message || "Failed to load institutes.",
          );
        }

        setInstitutes(results[1].body.institutes ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm({ ...blankForm });
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function startEdit(item: Resource) {
    const institute =
      typeof item.institute === "string"
        ? item.institute
        : (item.institute?._id ?? "");

    setForm({
      name: item.name ?? "",
      city: item.city ?? "",
      country: item.country ?? "",
      imageUrl: item.image?.url ?? "",
      publicId: item.image?.publicId ?? "",
      institute,
    });

    setEditingId(item._id);
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (settings.hasImage && (!form.imageUrl.trim() || !form.publicId.trim())) {
      setError("Enter both the image URL and Cloudinary public ID.");
      return;
    }

    if (settings.hasInstitute && !form.institute) {
      setError("Please select an institute.");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
      };

      if (settings.hasImage) {
        payload.image = {
          url: form.imageUrl.trim(),
          publicId: form.publicId.trim(),
        };
      }

      if (settings.hasLocation) {
        payload.city = form.city.trim();
        payload.country = form.country.trim();
      }

      if (settings.hasInstitute) {
        payload.institute = form.institute;
      }

      const response = await fetch(
        editingId ? `${settings.endpoint}/${editingId}` : settings.endpoint,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save.");
      }

      resetForm();
      setNotice(
        editingId
          ? "Record updated successfully."
          : "Record created successfully.",
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${settings.endpoint}/${itemToDelete._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete record.");
      }

      if (editingId === itemToDelete._id) {
        resetForm();
      }

      setItemToDelete(null);
      setDeleteError("");
      toast.success("Record deleted successfully.");

      await loadData();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete record.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function getInstituteName(item: Resource) {
    if (typeof item.institute === "string") {
      return (
        institutes.find((institute) => institute._id === item.institute)
          ?.name ?? "Unknown institute"
      );
    }

    return item.institute?.name ?? "Unknown institute";
  }

  return (
    <div className="mx-auto w-full space-y-7 p-4 md:p-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Explore Section</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          {settings.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{settings.description}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex justify-between items-center rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="cursor-pointer">
            <X size={18} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-zinc-900">
            {editingId ? "Edit record" : `Add ${resourceLabel[kind]}`}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900"
            >
              Cancel editing
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Name *</label>
          <input
            className={fieldClass}
            required
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder={
              kind === "campuses"
                ? "Milan Campus"
                : kind === "areas"
                  ? "Fashion"
                  : "Undergraduate"
            }
          />
        </div>

        {settings.hasInstitute && (
          <div>
            <label className={labelClass}>Institute *</label>
            <select
              className={fieldClass}
              required
              value={form.institute}
              onChange={(event) => setField("institute", event.target.value)}
            >
              <option value="">Select an institute</option>
              {institutes.map((institute) => (
                <option key={institute._id} value={institute._id}>
                  {institute.name}
                </option>
              ))}
            </select>

            {!institutes.length && (
              <p className="mt-1 text-xs text-amber-700">
                Create an institute first to use this form.
              </p>
            )}
          </div>
        )}

        {settings.hasLocation && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>City *</label>
              <input
                className={fieldClass}
                required
                value={form.city}
                onChange={(event) => setField("city", event.target.value)}
                placeholder="Milan"
              />
            </div>
            <div>
              <label className={labelClass}>Country *</label>
              <input
                className={fieldClass}
                required
                value={form.country}
                onChange={(event) => setField("country", event.target.value)}
                placeholder="Italy"
              />
            </div>
          </div>
        )}

        {settings.hasImage && (
          <div className="space-y-3">
            <MediaUploader
              label="Upload image"
              mediaType="explore-areas"
              value={
                form.imageUrl
                  ? {
                      url: form.imageUrl,
                      publicId: form.publicId,
                    }
                  : null
              }
              onChange={(media) => {
                setField("imageUrl", media?.url ?? "");
                setField("publicId", media?.publicId ?? "");
                setUploadError("");
              }}
              aspect="aspect-video"
              description="JPG, PNG or WebP · Maximum 10 MB"
            />

            {uploadError && (
              <p role="alert" className="text-sm text-red-600">
                {uploadError}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || (settings.hasInstitute && !institutes.length)}
          className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editingId
              ? "Update"
              : `Add ${resourceLabel[kind]}`}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">
              Existing records ({filteredItems.length})
            </h2>

            {filteredItems.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}{" "}
                of {filteredItems.length}
                {searchQuery.trim() && ` (filtered from ${items.length})`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search records..."
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-64"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-700"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              className="h-10 cursor-pointer rounded-lg px-3 text-sm font-medium text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-zinc-500">Loading records...</p>
        ) : filteredItems.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">
            {" "}
            {searchQuery.trim()
              ? `No records found matching "${searchQuery}".`
              : "No records added yet."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  {settings.hasImage && item.image?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image.url}
                      alt={item.name}
                      className="size-14 rounded-lg border border-zinc-200 object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {item.name}
                    </p>

                    {settings.hasLocation && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {item.city}, {item.country}
                      </p>
                    )}

                    {settings.hasInstitute && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {getInstituteName(item)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteError("");
                      }}
                      className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, pages) => (
                      <span key={page} className="flex items-center gap-1">
                        {index > 0 && pages[index - 1] !== page - 1 && (
                          <span className="px-1 text-zinc-400">...</span>
                        )}

                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`size-9 cursor-pointer rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-orange-600 text-white"
                              : "text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
      {/* DELETE CONFIRMATION */}
      <ConfirmDeleteModal
        open={!!itemToDelete}
        title={`Delete ${resourceLabel[kind]}?`}
        itemName={itemToDelete?.name}
        description="This record will be permanently removed."
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (isDeleting) return;

          setItemToDelete(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
