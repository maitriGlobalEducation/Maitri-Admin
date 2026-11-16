"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getInstitutesPage,
  type InstitutePage,
} from "@/services/explore-institutes.service";
import SearchableMultiSelect, {
  SelectOption,
} from "@/components/cms/explore/SearchableMultiSelect";
import TextEditor from "@/components/Common Components/TextEditor";
import MediaUploader from "@/components/cms/MediaUploader";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import {
  ExploreInstitute,
  ExploreInstituteInput,
  ExploreInstituteStatus,
} from "@/types/explore-institute";
import { formatDate } from "@/helpers/date";
import StatusSwitch, {
  StatusType,
} from "@/components/Common Components/StatusSwitch";
import DataTable from "@/components/Common Components/DataTable";
import { DataTableColumn } from "@/types/dataTable";

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

function getReferenceNames(records: (string | SelectOption)[] = []): string[] {
  return records.map((record) =>
    typeof record === "string" ? record : record.name,
  );
}

export default function InstitutesManager() {
  const [institutes, setInstitutes] = useState<InstituteRecord[]>([]);

  const [areas, setAreas] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<SelectOption[]>(
    [],
  );

  const [form, setForm] = useState<InstituteForm>(emptyForm);
  console.log({ form });

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

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [totalInstitutes, setTotalInstitutes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [pageLoading, setPageLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [validationError, setValidationError] = useState("");

  const pageCache = useRef(new Map<string, InstitutePage>());
  const requestControllers = useRef(new Map<string, AbortController>());

  const getCacheKey = (page: number, search: string) =>
    `${search.trim().toLowerCase()}::${page}`;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const prefetchPage = useCallback(async (page: number, search: string) => {
    if (page < 1) return;

    const key = getCacheKey(page, search);

    if (pageCache.current.has(key) || requestControllers.current.has(key)) {
      return;
    }

    const controller = new AbortController();
    requestControllers.current.set(key, controller);

    try {
      const result = await getInstitutesPage(page, search, controller.signal);

      pageCache.current.set(key, result);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Institute prefetch failed:", error);
      }
    } finally {
      requestControllers.current.delete(key);
    }
  }, []);

  // Prefetch both previous and next pages.
  const prefetchAdjacentPages = useCallback(
    (page: number, search: string, pagination: InstitutePage["pagination"]) => {
      if (pagination.hasPreviousPage) {
        void prefetchPage(page - 1, search);
      }

      if (pagination.hasNextPage) {
        void prefetchPage(page + 1, search);
      }
    },
    [prefetchPage],
  );

  const loadPage = useCallback(
    async (page: number, search: string, forceRefresh = false) => {
      const key = getCacheKey(page, search);

      if (forceRefresh) {
        pageCache.current.delete(key);
      }

      const cached = pageCache.current.get(key);

      if (cached) {
        setInstitutes(cached.institutes);
        setTotalInstitutes(cached.pagination.total);
        setTotalPages(cached.pagination.totalPages);
        setCurrentPage(page);
        setError("");
        setLoading(false);
        setPageLoading(false);

        // Keep neighboring pages ready.
        prefetchAdjacentPages(page, search, cached.pagination);

        return;
      }

      setPageLoading(true);

      if (institutes.length === 0) {
        setLoading(true);
      }

      try {
        const result = await getInstitutesPage(page, search);

        pageCache.current.set(key, result);

        setInstitutes(result.institutes);
        setTotalInstitutes(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setCurrentPage(page);
        setError("");

        // Prepare previous and next pages in the background.
        prefetchAdjacentPages(page, search, result.pagination);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load institutes.",
        );
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    },
    [prefetchAdjacentPages, institutes.length],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void loadPage(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadPage]);

  const loadReferenceData = useCallback(async () => {
    setDataLoading(true);
    try {
      const endpoints = [
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
        throw new Error(
          failed.body.message || "Failed to load reference data.",
        );
      }

      const [areaResult, brandResult, campusResult] = results;

      setAreas(areaResult.body.areas ?? []);
      setBrands(brandResult.body.brands ?? []);
      setAvailableCampuses(campusResult.body.campuses ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reference data.",
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

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
    console.log("Selected institute:", institute.name);
    console.log("Selected keywords:", institute.metaKeywords);
    setEditingId(institute._id);
    setManualSlug(true);
    setMetaKeywordsInput(institute.metaKeywords?.join(", ") ?? "");

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

  const hasContent = (content: unknown): boolean => {
    if (!content) return false;

    if (typeof content === "string") {
      return content.trim().length > 0;
    }

    if (typeof content === "object") {
      const doc = content as {
        content?: Array<{
          text?: string;
          content?: unknown[];
        }>;
      };

      return Boolean(
        doc.content?.some(
          (node) =>
            node.text?.trim() || (node.content && node.content.length > 0),
        ),
      );
    }

    return false;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setValidationError("Institute name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setValidationError("URL slug is required.");
      return;
    }

    if (!form.logo?.url) {
      setValidationError("Institute logo is required.");
      return;
    }

    if (!form.content || !hasContent(form.content)) {
      setValidationError("Institute content is required.");
      return;
    }

    setSaving(true);

    const metaKeywords = metaKeywordsInput
      .split(",")
      .map((keyword: string) => keyword.trim())
      .filter(Boolean);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),

        areas: areas
          .filter((area) => form.areas.includes(area._id))
          .map((area) => ({
            areaId: area._id,
            slug: area.slug,
          })),

        brands: brands
          .filter((brand) => form.brands.includes(brand._id))
          .map((brand) => ({
            brandId: brand._id,
            slug: brand.slug,
          })),

        campuses: availableCampuses
          .filter((campus) => form.campuses.includes(campus._id))
          .map((campus) => ({
            campusId: campus._id,
            slug: campus.slug,
          })),

        metaKeywords,
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/cms/explore/institutes/${editingId}`
          : "/api/cms/explore/institutes",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Unable to save institute.");
        return;
      }

      // The API should return the populated institute.
      const savedInstitute: InstituteRecord = result.institute;

      if (!savedInstitute?._id) {
        throw new Error("Institute saved, but the returned data is invalid.");
      }

      if (editingId) {
        setInstitutes((prev) =>
          prev.map((institute) =>
            institute._id === savedInstitute._id ? savedInstitute : institute,
          ),
        );
      } else {
        setInstitutes((prev) => [savedInstitute, ...prev]);
        setCurrentPage(1);
      }

      toast.success(isEditing ? "Institute Updated" : "Institute Added");

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save institute.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleInstituteStatusChange(
    instituteId: string,
    newStatus: StatusType,
  ) {
    try {
      const response = await fetch(
        `/api/cms/explore/institutes/${instituteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update institute status.");
      }

      const updatedInstitute: InstituteRecord = result.institute;

      if (!updatedInstitute?._id) {
        throw new Error("Invalid institute data returned.");
      }

      // Update institute directly in the existing state.
      setInstitutes((previous) =>
        previous.map((institute) =>
          institute._id === updatedInstitute._id ? updatedInstitute : institute,
        ),
      );

      toast.success(
        `Institute ${newStatus === "published" ? "published" : "moved to draft"} successfully.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update institute status.";

      toast.error(message);
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

      pageCache.current.clear();

      const nextPage =
        institutes.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      setCurrentPage(nextPage);
      await loadPage(nextPage, debouncedSearch, true);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete institute.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  type InstituteRow = (typeof institutes)[number];

  const instituteColumns: DataTableColumn<InstituteRow>[] = [
    {
      key: "logo",
      header: "Logo",
      headerClassName: "w-20",
      cellClassName: "w-20",
      render: (institute) =>
        institute.logo?.url ? (
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
        ),
    },
    {
      key: "institute",
      header: "Institute",
      render: (institute) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">
            {institute.name}
          </p>
          <p className="mt-1 truncate text-zinc-500">
            {formatDate(institute.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "areas",
      header: "Areas",
      render: (institute) => {
        const areaNames = getReferenceNames(institute.areas);

        return areaNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {areaNames.slice(0, 2).map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="max-w-full truncate rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-600"
              >
                {name}
              </span>
            ))}

            {areaNames.length > 2 && (
              <span className="rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-500">
                +{areaNames.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">No areas</span>
        );
      },
    },
    {
      key: "campuses",
      header: "Campuses",
      render: (institute) => {
        const campusNames = getReferenceNames(institute.campuses);

        return campusNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {campusNames.slice(0, 2).map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="max-w-full truncate rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-600"
              >
                {name}
              </span>
            ))}

            {campusNames.length > 2 && (
              <span className="rounded-md bg-zinc-200 px-2 py-1 font-medium text-zinc-500">
                +{campusNames.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">No campuses</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      render: (institute) => (
        <StatusSwitch
          status={institute.status}
          size="sm"
          onChange={(newStatus) =>
            handleInstituteStatusChange(institute._id, newStatus)
          }
        />
      ),
    },
  ];

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
              <label className={labelClass}>
                Institute name{" "}
                <span className="text-red-500 italic">(required*)</span>
              </label>
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
              <label className={labelClass}>URL slug</label>
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
              required
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
          <h3 className="border-b border-zinc-100 py-6 font-medium text-zinc-800">
            Institute page content
          </h3>

          <div>
            <label className={labelClass}>
              Institute content{" "}
              <span className="text-red-500 italic">(required*)</span>
            </label>

            <TextEditor
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

      <DataTable
        columns={instituteColumns}
        data={institutes}
        getRowKey={(institute) => institute._id}
        loading={loading || pageLoading}
        loadingState={
          <p className="text-sm text-zinc-500">Loading institutes...</p>
        }
        emptyState={
          <div className="py-2 text-center">
            <p className="text-sm font-medium text-zinc-700">
              {debouncedSearch
                ? `No institutes found matching "${debouncedSearch}".`
                : "No institutes yet."}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {debouncedSearch
                ? "Try searching with a different name, area, or campus."
                : "Create your first institute using the form above."}
            </p>
          </div>
        }
        minWidth="950px"
        toolbar={{
          title: `Existing institutes (${totalInstitutes})`,
          description:
            institutes.length > 0
              ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  totalInstitutes,
                )} of ${totalInstitutes}`
              : "Manage your institute records",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Search institutes...",
          refreshing: dataLoading,
          onRefresh: () => {
            pageCache.current.clear();
            void loadPage(currentPage, debouncedSearch, true);
            void loadReferenceData();
          },
        }}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        actions={{
          onEdit: startEdit,
          onDelete: (blog) => {
            setDeleteError("");
            setInstituteToDelete(blog);
          },
          editTitle: "Edit Institute",
          deleteTitle: "Delete Institute",
        }}
      />

      {validationError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl duration-200">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-6 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900">
              Required field missing
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {validationError}
            </p>

            <button
              type="button"
              onClick={() => setValidationError("")}
              className="mt-6 w-full cursor-pointer rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!instituteToDelete}
        title="Delete institute?"
        itemName={instituteToDelete?.name}
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
