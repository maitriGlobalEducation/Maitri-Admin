"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ExploreInstitute,
  ExploreInstituteInput,
  InstituteCampus,
  InstituteImage,
  ExploreInstituteStatus,
} from "@/types/explore-institute";
import SearchableMultiSelect, {
  SelectOption,
} from "@/components/cms/explore/SearchableMultiSelect";
import InstituteImageUpload from "@/components/cms/explore/InstituteImageUpload";
import BlogEditor from "@/components/cms/blogs/BlogEditor";
import MediaUploader from "@/components/cms/MediaUploader";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { Search, X } from "lucide-react";

type Category = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
};

type InstituteForm = Omit<ExploreInstituteInput, "campuses"> & {
  areas: string[];
  brands: string[];
  campuses: string[];
};

type InstituteRecord = Omit<
  ExploreInstitute,
  "areas" | "brands" | "campuses"
> & {
  areas: (string | SelectOption)[];
  brands: (string | SelectOption)[];
  campuses: (string | SelectOption)[];
};

function getReferenceIds(records: (string | SelectOption)[] = []): string[] {
  return records.map((record) =>
    typeof record === "string" ? record : record._id,
  );
}

const emptyForm: InstituteForm = {
  name: "",
  slug: "",
  shortDescription: "",
  logo: null,
  banner: null,
  areas: [],
  brands: [],
  campuses: [],
  overview: "",
  content: {
    type: "doc",
    content: [{ type: "paragraph" }],
  },
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  focusKeyword: "",
  sortOrder: 0,
  status: "draft",
  featured: false,
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCategoryIds(categories: (string | Category)[]) {
  return categories.map((category) =>
    typeof category === "string" ? category : category._id,
  );
}

function getReferenceNames(records: (string | SelectOption)[] = []): string[] {
  return records.map((record) =>
    typeof record === "string" ? record : record.name,
  );
}

export default function InstitutesManager() {
  const [institutes, setInstitutes] = useState<InstituteRecord[]>([]);
  // const [categories, setCategories] = useState<Category[]>([]);

  const [areas, setAreas] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<SelectOption[]>(
    [],
  );

  const [form, setForm] = useState<InstituteForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualSlug, setManualSlug] = useState(false);
  const [instituteToDelete, setInstituteToDelete] =
    useState<InstituteRecord | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [metaKeywordsInput, setMetaKeywordsInput] = useState(
    form.metaKeywords.join(", "),
  );

  const ITEMS_PER_PAGE = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInstitutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return institutes;

    return institutes.filter((institute) => {
      const areaNames = getReferenceNames(institute.areas);
      const campusNames = getReferenceNames(institute.campuses);

      const searchableValues = [
        institute.name,
        institute.slug,
        institute.status,
        ...areaNames,
        ...campusNames,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [institutes, searchQuery]);

  const totalPages = Math.ceil(filteredInstitutes.length / ITEMS_PER_PAGE);

  const paginatedInstitutes = filteredInstitutes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        "/api/cms/explore/institutes",
        "/api/cms/explore/categories",
        "/api/cms/explore/areas",
        "/api/cms/explore/brands",
        "/api/cms/explore/campuses",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => fetch(endpoint)),
      );

      const results = await Promise.all(
        responses.map(async (response) => ({
          ok: response.ok,
          body: await response.json(),
        })),
      );

      const failed = results.find((result) => !result.ok);

      if (failed) {
        throw new Error(failed.body.message || "Failed to load Explore data.");
      }

      const [
        instituteResult,
        categoryResult,
        areaResult,
        brandResult,
        campusResult,
      ] = results;

      setInstitutes(instituteResult.body.institutes ?? []);
      setAreas(areaResult.body.areas ?? []);
      setBrands(brandResult.body.brands ?? []);
      setAvailableCampuses(campusResult.body.campuses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateField<K extends keyof InstituteForm>(
    key: K,
    value: InstituteForm[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setManualSlug(false);
    setError("");
    setMetaKeywordsInput("");
  }

  function startEdit(institute: InstituteRecord) {
    setEditingId(institute._id);
    setManualSlug(true);

    setForm({
      name: institute.name,
      slug: institute.slug,
      shortDescription: institute.shortDescription ?? "",
      logo: institute.logo ?? null,
      banner: institute.banner ?? null,
      areas: getReferenceIds(institute.areas),
      brands: getReferenceIds(institute.brands),
      campuses: getReferenceIds(institute.campuses),
      overview: institute.overview ?? "",
      content: institute.content ?? [],
      metaTitle: institute.metaTitle ?? "",
      metaDescription: institute.metaDescription ?? "",
      metaKeywords: institute.metaKeywords ?? [],
      focusKeyword: institute.focusKeyword ?? "",
      sortOrder: institute.sortOrder ?? 0,
      status: institute.status,
      featured: institute.featured ?? false,
    });

    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // function updateCampus(index: number, key: keyof CampusForm, value: string) {
  //   setCampuses((previous) =>
  //     previous.map((campus, i) =>
  //       i === index ? { ...campus, [key]: value } : campus,
  //     ),
  //   );
  // }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.logo?.url || !form.logo.publicId) {
      toast.error("Please upload the institute logo.");
      return;
    }

    setSaving(true);

    const metaKeywords = metaKeywordsInput
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        areas: form.areas,
        brands: form.brands,
        campuses: form.campuses,
        metaKeywords,
      };

      const response = await fetch(
        editingId
          ? `/api/cms/explore/institutes/${editingId}`
          : "/api/cms/explore/institutes",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to save institute.");
        return;
      }

      toast.success(editingId ? "Institute Updated" : "Institute Added");
      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save institute.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteInstitute() {
    if (!instituteToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/cms/explore/institutes/${instituteToDelete._id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete institute.");
      }

      setInstituteToDelete(null);
      setDeleteError("");

      toast.success("Institute deleted successfully.");

      if (editingId === instituteToDelete._id) {
        resetForm();
      }

      await loadData();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete institute.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full space-y-8 p-4 md:p-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Explore Section</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          Institute Management
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage institutes, category associations, campuses and institute page
          content.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            {editingId ? "Edit institute" : "Add an institute"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Cancel editing
            </button>
          )}
        </div>

        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Basic information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Institute name *</label>
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((previous) => ({
                    ...previous,
                    name,
                    ...(!manualSlug ? { slug: makeSlug(name) } : {}),
                  }));
                }}
                placeholder="Istituto Marangoni"
              />
            </div>

            <div>
              <label className={labelClass}>URL slug *</label>
              <input
                className={inputClass}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={form.slug}
                onChange={(event) => {
                  setManualSlug(true);
                  updateField("slug", makeSlug(event.target.value));
                }}
                placeholder="istituto-marangoni"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Short description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.shortDescription}
              onChange={(event) =>
                updateField("shortDescription", event.target.value)
              }
              placeholder="A short introduction shown on institute category cards."
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Institute images
          </h3>

          <div className="grid gap-5 md:grid-cols-2">
            <MediaUploader
              label="Institute logo"
              mediaType="explore-institutes"
              value={form.logo}
              onChange={(media) => updateField("logo", media)}
              aspect="aspect-square"
            />

            <MediaUploader
              label="Institute banner"
              mediaType="explore-institutes"
              value={form.banner}
              onChange={(media) => updateField("banner", media)}
              aspect="aspect-video"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Institute page content
          </h3>

          <div>
            <label className={labelClass}>Institute content</label>

            <BlogEditor
              content={form.content}
              onChange={(content) => updateField("content", content)}
            />

            <p className="mt-2 text-xs text-zinc-500">
              Add detailed institute information using headings, paragraphs,
              images, tables, lists and links.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <section className="space-y-5">
            <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
              Explore associations
            </h3>

            <SearchableMultiSelect
              label="Areas"
              options={areas}
              value={form.areas}
              onChange={(value) => updateField("areas", value)}
              placeholder="Search areas..."
            />

            <SearchableMultiSelect
              label="Brands"
              options={brands}
              value={form.brands}
              onChange={(value) => updateField("brands", value)}
              placeholder="Search brands..."
            />

            <SearchableMultiSelect
              label="Campuses"
              options={availableCampuses}
              value={form.campuses}
              onChange={(value) => updateField("campuses", value)}
              placeholder="Search campuses..."
            />
          </section>
        </section>

        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            SEO settings
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Meta title</label>
              <input
                className={inputClass}
                value={form.metaTitle}
                onChange={(event) =>
                  updateField("metaTitle", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Focus keyword</label>
              <input
                className={inputClass}
                value={form.focusKeyword}
                onChange={(event) =>
                  updateField("focusKeyword", event.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Meta description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.metaDescription}
              onChange={(event) =>
                updateField("metaDescription", event.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Meta keywords</label>
            <input
              className={inputClass}
              value={metaKeywordsInput}
              onChange={(event) => setMetaKeywordsInput(event.target.value)}
              placeholder="fashion institute, design courses, ..."
            />
          </div>
        </section>

        <section className="grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as ExploreInstituteStatus,
                )
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Display order</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(event) =>
                updateField("sortOrder", Number(event.target.value))
              }
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-zinc-200 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                updateField("featured", event.target.checked)
              }
              className="size-4 accent-orange-600"
            />
            Feature this institute
          </label>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update institute"
                : "Create institute"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="cursor-pointer rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">
              Existing institutes ({filteredInstitutes.length})
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredInstitutes.length > 0
                ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredInstitutes.length,
                  )} of ${filteredInstitutes.length}${
                    searchQuery.trim()
                      ? ` (filtered from ${institutes.length})`
                      : ""
                  }`
                : "Manage your institute records"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search institutes..."
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-64"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-700"
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
          <p className="p-6 text-sm text-zinc-500">Loading institutes...</p>
        ) : filteredInstitutes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">
              {searchQuery.trim()
                ? `No institutes found matching "${searchQuery}".`
                : "No institutes yet."}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {searchQuery.trim()
                ? "Try searching with a different name, area, or campus."
                : "Create your first institute using the form above."}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <div className="min-w-237.5">
                {/* Column headings */}
                <div className="grid grid-cols-[70px_minmax(190px,1.5fr)_110px_minmax(150px,1fr)_minmax(160px,1.2fr)_150px] items-center gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3">
                  {[
                    "Logo",
                    "Institute",
                    "Status",
                    "Areas",
                    "Campuses",
                    "Actions",
                  ].map((heading) => (
                    <p
                      key={heading}
                      className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
                    >
                      {heading}
                    </p>
                  ))}
                </div>

                {/* Records */}
                <div className="divide-y divide-zinc-100">
                  {paginatedInstitutes.map((institute) => {
                    const areaNames = getReferenceNames(institute.areas);
                    const campusNames = getReferenceNames(institute.campuses);

                    return (
                      <div
                        key={institute._id}
                        className="grid grid-cols-[70px_minmax(190px,1.5fr)_110px_minmax(150px,1fr)_minmax(160px,1.2fr)_150px] items-center gap-4 px-5 py-4 transition hover:bg-zinc-50/70"
                      >
                        {/* Logo */}
                        <div>
                          {institute.logo?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={institute.logo.url}
                              alt={`${institute.name} logo`}
                              className="size-12 rounded-lg border border-zinc-200 bg-white object-contain p-1"
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-[10px] text-zinc-400">
                              No logo
                            </div>
                          )}
                        </div>

                        {/* Institute */}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {institute.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {institute.slug}
                          </p>

                          {institute.featured && (
                            <span className="mt-2 inline-flex rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                              institute.status === "published"
                                ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                                : "border-amber-500 bg-amber-100 text-amber-700"
                            }`}
                          >
                            {institute.status}
                          </span>
                        </div>

                        {/* Areas */}
                        <div className="min-w-0">
                          {areaNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {areaNames.slice(0, 2).map((name, index) => (
                                <span
                                  key={`${name}-${index}`}
                                  className="max-w-full truncate rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                                >
                                  {name}
                                </span>
                              ))}
                              {areaNames.length > 2 && (
                                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500">
                                  +{areaNames.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              No areas
                            </span>
                          )}
                        </div>

                        {/* Campuses */}
                        <div className="min-w-0">
                          {campusNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {campusNames.slice(0, 2).map((name, index) => (
                                <span
                                  key={`${name}-${index}`}
                                  className="max-w-full truncate rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                                >
                                  {name}
                                </span>
                              ))}
                              {campusNames.length > 2 && (
                                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500">
                                  +{campusNames.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              No campuses
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(institute)}
                            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInstituteToDelete(institute);
                              setDeleteError("");
                            }}
                            className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3">
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
      <ConfirmDeleteModal
        open={!!instituteToDelete}
        title="Delete institute?"
        itemName={instituteToDelete?.name}
        description="This will permanently remove the institute and its associated information."
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (isDeleting) return;

          setInstituteToDelete(null);
          setDeleteError("");
        }}
        onConfirm={deleteInstitute}
      />
    </div>
  );
}
