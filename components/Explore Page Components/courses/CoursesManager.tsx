"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

import SearchableMultiSelect, {
  SelectOption,
} from "@/components/cms/explore/SearchableMultiSelect";
import BlogEditor from "@/components/cms/blogs/BlogEditor";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

import {
  COURSE_INTAKES,
  COURSE_LANGUAGES,
  type CourseCampusOfferingInput,
  type CourseDurationUnit,
  type CourseIntake,
  type CourseLanguage,
  type ExploreCourse,
  type ExploreCourseInput,
  type ExploreCourseStatus,
} from "@/types/explore-course";

import {
  getCoursesPage,
  type CoursePage,
} from "@/services/explore-courses.service";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

const ITEMS_PER_PAGE = 10;

type ReferenceOption = SelectOption & {
  city?: string;
  country?: string;
};

type InstituteOption = SelectOption & {
  areas?: (string | SelectOption)[];
  campuses?: (string | SelectOption)[];
};

type ScholarshipRecord = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
};

type ScholarshipOption = {
  _id: string;
  name: string;
  slug?: string;
};

type CourseRecord = Omit<
  ExploreCourse,
  "courseCategory" | "area" | "institute" | "campusOfferings"
> & {
  courseCategory: string | SelectOption;
  area: string | SelectOption;
  institute: string | SelectOption;
  fees?: number;
  scholarships?: Array<string | ScholarshipRecord>;
  campusOfferings: {
    _id?: string;
    campus: string | SelectOption;
    intakes: CourseIntake[];
    language: CourseLanguage;
  }[];
};

type CourseForm = ExploreCourseInput;

const emptyOffering: CourseCampusOfferingInput = {
  campus: "",
  intakes: [],
  language: "English",
};

const emptyForm: CourseForm = {
  name: "",
  slug: "",
  courseCategory: "",
  area: "",
  institute: "",
  duration: {
    value: 1,
    unit: "years",
  },
  fees: "",
  scholarships: [],
  durationFeatures: "",
  campusOfferings: [{ ...emptyOffering }],
  description: {
    type: "doc",
    content: [{ type: "paragraph" }],
  },
  status: "draft",
  sortOrder: 0,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getReferenceId(value: string | SelectOption | undefined): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function getReferenceName(value: string | SelectOption | undefined): string {
  if (!value) return "—";
  return typeof value === "string" ? value : value.name;
}

function getErrorMessage(result: any, fallback: string) {
  return result?.message || fallback;
}

export default function CoursesManager() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [scholarships, setScholarships] = useState<ScholarshipOption[]>([]);
  const [feeCurrency, setFeeCurrency] = useState("USD");

  const [categories, setCategories] = useState<ReferenceOption[]>([]);
  const [areas, setAreas] = useState<ReferenceOption[]>([]);
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [campuses, setCampuses] = useState<ReferenceOption[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualSlug, setManualSlug] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [courseToDelete, setCourseToDelete] = useState<CourseRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [totalCourses, setTotalCourses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [validationError, setValidationError] = useState("");

  const pageCache = useRef(new Map<string, CoursePage>());
  const requestControllers = useRef(new Map<string, AbortController>());
  const activeRequest = useRef(0);

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
      const result = await getCoursesPage(page, search, controller.signal);

      pageCache.current.set(key, result);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Course prefetch failed:", error);
      }
    } finally {
      requestControllers.current.delete(key);
    }
  }, []);

  const loadPage = useCallback(
    async (page: number, search: string, forceRefresh = false) => {
      const key = getCacheKey(page, search);
      const requestId = ++activeRequest.current;

      if (forceRefresh) {
        pageCache.current.delete(key);
      }

      const cached = pageCache.current.get(key);

      if (cached) {
        setCourses(cached.courses as CourseRecord[]);
        setTotalCourses(cached.pagination.total);
        setTotalPages(cached.pagination.totalPages);
        setCurrentPage(page);
        setLoading(false);
        setPageLoading(false);
        setError("");

        if (cached.pagination.hasNextPage) {
          void prefetchPage(page + 1, search);
        }

        return;
      }

      setPageLoading(true);

      if (courses.length === 0) {
        setLoading(true);
      }

      try {
        const result = await getCoursesPage(page, search);

        if (requestId !== activeRequest.current) return;

        pageCache.current.set(key, result);

        setCourses(result.courses as CourseRecord[]);
        setTotalCourses(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setCurrentPage(page);
        setError("");

        if (result.pagination.hasNextPage) {
          void prefetchPage(page + 1, search);
        }
      } catch (error) {
        if (requestId !== activeRequest.current) return;

        setError(
          error instanceof Error ? error.message : "Failed to load courses.",
        );
      } finally {
        if (requestId === activeRequest.current) {
          setLoading(false);
          setPageLoading(false);
        }
      }
    },
    [courses.length, prefetchPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void loadPage(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadPage]);

  const loadReferenceData = useCallback(async () => {
    try {
      const endpoints = [
        "/api/cms/explore/course-categories",
        "/api/cms/explore/areas",
        "/api/cms/explore/institutes",
        "/api/cms/explore/campuses",
        "/api/cms/scholarships",
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
          getErrorMessage(failed.body, "Failed to load course references."),
        );
      }

      const [
        categoryResult,
        areaResult,
        instituteResult,
        campusResult,
        scholarshipResult,
      ] = results;

      setCategories(categoryResult.body.courseCategories ?? []);
      setAreas(areaResult.body.areas ?? []);
      setInstitutes(instituteResult.body.institutes ?? []);
      setCampuses(campusResult.body.campuses ?? []);
      const scholarshipData: ScholarshipRecord[] =
        scholarshipResult.body.data ?? [];

      setScholarships(
        scholarshipData.map((scholarship) => ({
          _id: scholarship._id,
          name: scholarship.title,
          slug: scholarship.slug,
        })),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load course references.",
      );
    }
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  function updateField<K extends keyof CourseForm>(
    key: K,
    value: CourseForm[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      duration: { ...emptyForm.duration },
      campusOfferings: [{ ...emptyOffering }],
    });

    setEditingId(null);
    setManualSlug(false);
    setError("");
  }

  function handleInstituteChange(instituteId: string) {
    updateField("institute", instituteId);
  }

  function updateOffering(
    index: number,
    key: keyof CourseCampusOfferingInput,
    value: CourseCampusOfferingInput[keyof CourseCampusOfferingInput],
  ) {
    setForm((previous) => ({
      ...previous,
      campusOfferings: previous.campusOfferings.map((offering, i) =>
        i === index ? { ...offering, [key]: value } : offering,
      ),
    }));
  }

  function addOffering() {
    setForm((previous) => ({
      ...previous,
      campusOfferings: [...previous.campusOfferings, { ...emptyOffering }],
    }));
  }

  function removeOffering(index: number) {
    setForm((previous) => ({
      ...previous,
      campusOfferings: previous.campusOfferings.filter((_, i) => i !== index),
    }));
  }

  function parseFees(fees: string) {
    const match = fees.match(/^([A-Z]{3})\s+(\d+)$/);

    if (!match) {
      return {
        currency: "USD",
        amount: fees,
      };
    }

    return {
      currency: match[1],
      amount: match[2],
    };
  }

  function startEdit(course: CourseRecord) {
    setEditingId(course._id);
    setManualSlug(true);

    const parsedFees = parseFees(course.fees ?? "");

    setFeeCurrency(parsedFees.currency);

    setForm({
      name: course.name,
      slug: course.slug,
      courseCategory: getReferenceId(course.courseCategory),
      area: getReferenceId(course.area),
      institute: getReferenceId(course.institute),

      duration: course.duration,
      durationFeatures: course.durationFeatures ?? "",

      fees: parsedFees.amount,
      scholarships:
        course.scholarships?.map((scholarship) =>
          getReferenceId(scholarship),
        ) ?? [],

      campusOfferings: course.campusOfferings.map((offering) => ({
        campus: getReferenceId(offering.campus),
        intakes: offering.intakes ?? [],
        language: offering.language,
      })),

      description: course.description ?? {
        type: "doc",
        content: [{ type: "paragraph" }],
      },

      status: course.status,
      sortOrder: course.sortOrder ?? 0,
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
      setValidationError("Course name is required.");
      return;
    }

    if (!form.courseCategory) {
      setValidationError("Please select a course category.");
      return;
    }

    if (!form.area) {
      setValidationError("Please select an area.");
      return;
    }

    if (!form.institute) {
      setValidationError("Please select an institute.");
      return;
    }

    if (!form.fees) {
      setValidationError("Please enter the course fee amount.");
      return;
    }

    if (!form.description || !hasContent(form.description)) {
      setValidationError("Course description is required.");
      return;
    }

    if (
      form.campusOfferings.some(
        (offering) =>
          !offering.campus ||
          offering.intakes.length === 0 ||
          !offering.language,
      )
    ) {
      toast.error(
        "Please complete the campus, intake and language fields for each offering.",
      );
      return;
    }

    setSaving(true);

    try {
      const selectedInstitute = institutes.find(
        (item) => String(item._id) === String(form.institute),
      );

      const selectedArea = areas.find(
        (item) => String(item._id) === String(form.area),
      );

      const selectedCourseCategory = categories.find(
        (item) => String(item._id) === String(form.courseCategory),
      );

      console.log({
        institute: selectedInstitute,
        area: selectedArea,
        category: selectedCourseCategory,
      });

      if (
        !selectedInstitute?.slug ||
        !selectedArea?.slug ||
        !selectedCourseCategory?.slug
      ) {
        throw new Error(
          "Unable to find the slug for the selected institute, area, or course category.",
        );
      }

      const payload = {
        ...form,
        fees: `${feeCurrency} ${form.fees}`,
        name: form.name.trim(),
        slug: form.slug.trim(),

        institute: {
          instituteId: selectedInstitute._id,
          slug: selectedInstitute.slug,
        },

        area: {
          areaId: selectedArea._id,
          slug: selectedArea.slug,
        },

        courseCategory: {
          categoryId: selectedCourseCategory._id,
          slug: selectedCourseCategory.slug,
        },

        campusOfferings: form.campusOfferings.map((offering) => {
          const campus = campuses.find((item) => item._id === offering.campus);

          if (!campus?.slug) {
            throw new Error("Unable to find the selected campus slug.");
          }

          return {
            ...offering,
            campus: {
              campusId: campus._id,
              slug: campus.slug,
            },
          };
        }),
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/cms/explore/courses/${editingId}`
          : "/api/cms/explore/courses",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save course.");
      }

      toast.success(
        isEditing
          ? "Course updated successfully."
          : "Course created successfully.",
      );

      resetForm();

      pageCache.current.clear();

      const pageToLoad = isEditing ? currentPage : 1;
      setCurrentPage(pageToLoad);

      await loadPage(pageToLoad, debouncedSearch, true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save course.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse() {
    if (!courseToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/cms/explore/courses/${courseToDelete._id}`,
        { method: "DELETE" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete course.");
      }

      toast.success("Course deleted successfully.");

      if (editingId === courseToDelete._id) {
        resetForm();
      }

      setCourseToDelete(null);
      pageCache.current.clear();

      const nextPage =
        courses.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      setCurrentPage(nextPage);
      await loadPage(nextPage, debouncedSearch, true);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete course.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const intakeOptions: SelectOption[] = COURSE_INTAKES.map((month) => ({
    _id: month,
    name: month,
  }));

  return (
    <div className="mx-auto w-full space-y-8 p-4 md:p-6">
      {/* Page heading */}
      <div>
        <p className="text-sm font-medium text-orange-600">Explore Section</p>

        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          Course Management
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Create and manage courses, their institutes, areas, duration, campus
          offerings and intake details.
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

      {/* Course form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            {editingId ? "Edit course" : "Add a course"}
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

        {/* Basic information */}
        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Basic information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Course name{" "}
                <span className="text-red-500 italic">(required*)</span>
              </label>

              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;

                  setForm((previous) => ({
                    ...previous,
                    name,
                    ...(!manualSlug ? { slug: makeSlug(name) } : {}),
                  }));
                }}
                placeholder="Fashion Design"
              />
            </div>

            <div>
              <label className={labelClass}>URL slug</label>

              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={inputClass}
                value={form.slug}
                onChange={(event) => {
                  setManualSlug(true);
                  updateField("slug", makeSlug(event.target.value));
                }}
                placeholder="fashion-design"
              />
            </div>

            <div>
              <SearchableMultiSelect
                label="Course category"
                options={categories}
                value={form.courseCategory ? [form.courseCategory] : []}
                onChange={(value) =>
                  updateField("courseCategory", value[0] ?? "")
                }
                placeholder="Search course categories..."
                multiple={false}
                required
              />
            </div>

            <div>
              <SearchableMultiSelect
                label="Institute"
                options={institutes}
                value={form.institute ? [form.institute] : []}
                onChange={(value) => handleInstituteChange(value[0] ?? "")}
                placeholder="Search institutes..."
                multiple={false}
                required
              />
            </div>

            <div>
              <SearchableMultiSelect
                label="Area"
                options={areas}
                value={form.area ? [form.area] : []}
                onChange={(value) => updateField("area", value[0] ?? "")}
                placeholder="Search all areas..."
                multiple={false}
                required
              />
            </div>

            <SearchableMultiSelect
              label="Scholarships"
              options={scholarships}
              value={form.scholarships}
              onChange={(value) => updateField("scholarships", value)}
              placeholder="Search scholarships..."
              multiple={false}
            />
          </div>
        </section>

        {/* Fees */}
        <div>
          <label className={labelClass}>
            Course fees <span className="text-red-500 italic">(required*)</span>
          </label>

          <div className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            {/* Currency dropdown */}
            <div className="relative flex h-full shrink-0 items-center bg-zinc-50">
              <select
                value={feeCurrency}
                onChange={(event) => setFeeCurrency(event.target.value)}
                className="h-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-7 text-sm font-medium text-zinc-700 outline-none"
              >
                <option value="USD">USD $</option>
                <option value="INR">INR ₹</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
                <option value="CAD">CAD $</option>
                <option value="AUD">AUD $</option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 text-zinc-400"
              />
            </div>

            {/* Divider */}
            <div className="h-6 w-px shrink-0 bg-zinc-200" />

            {/* Amount input */}
            <input
              type="text"
              inputMode="numeric"
              required
              pattern="[0-9]+"
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              value={form.fees}
              onChange={(event) => {
                const value = event.target.value;

                if (/^\d*$/.test(value)) {
                  updateField("fees", value);
                }
              }}
              placeholder="Enter course fees"
            />
          </div>
        </div>

        {/* Duration */}
        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Course duration
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Duration{" "}
                <span className="text-red-500 italic">(required*)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  pattern="[0-9]+"
                  className={inputClass}
                  value={form.duration.value}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (/^\d*$/.test(value)) {
                      updateField("duration", {
                        ...form.duration,
                        value: value === "" ? 0 : Number(value),
                      });
                    }
                  }}
                />

                <select
                  className={`${inputClass} max-w-40`}
                  value={form.duration.unit}
                  onChange={(event) =>
                    updateField("duration", {
                      ...form.duration,
                      unit: event.target.value as CourseDurationUnit,
                    })
                  }
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Duration features</label>

              <input
                className={inputClass}
                value={form.durationFeatures}
                onChange={(event) =>
                  updateField("durationFeatures", event.target.value)
                }
                placeholder="e.g. 3 years full-time"
              />
            </div>
          </div>
        </section>

        {/* Campus offerings */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-2">
            <h3 className="font-medium text-zinc-800">Campus offerings</h3>

            <button
              type="button"
              onClick={addOffering}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              <Plus className="size-4" />
              Add campus
            </button>
          </div>

          {/* {!form.institute && (
            <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500">
              Select an institute first to add campus offerings.
            </p>
          )} */}

          {/* {form.institute && instituteCampuses.length === 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              This institute has no associated campuses.
            </p>
          )} */}

          <div className="space-y-4">
            {form.campusOfferings.map((offering, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-800">
                    Campus offering {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeOffering(index)}
                    className="cursor-pointer rounded-md p-1.5 text-red-500 hover:bg-red-50"
                    aria-label={`Remove campus offering ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <SearchableMultiSelect
                      label="Campus"
                      options={campuses}
                      value={offering.campus ? [offering.campus] : []}
                      onChange={(value) =>
                        updateOffering(index, "campus", value[0] ?? "")
                      }
                      placeholder="Search all campuses..."
                      multiple={false}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Language *</label>

                    <select
                      required
                      className={inputClass}
                      value={offering.language}
                      onChange={(event) =>
                        updateOffering(
                          index,
                          "language",
                          event.target.value as CourseLanguage,
                        )
                      }
                    >
                      {COURSE_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <SearchableMultiSelect
                  label="Intake months *"
                  options={intakeOptions}
                  value={offering.intakes}
                  onChange={(value) =>
                    updateOffering(index, "intakes", value as CourseIntake[])
                  }
                  placeholder="Search and select intake months..."
                />
              </div>
            ))}
          </div>
        </section>

        {/* Description */}
        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
            Course description{" "}
            <span className="text-red-500 italic">(required*)</span>
          </h3>

          <BlogEditor
            content={form.description}
            onChange={(content) =>
              updateField("description", content as Record<string, unknown>)
            }
          />
        </section>

        {/* Status */}
        <section className="grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Status</label>

            <select
              className={inputClass}
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as ExploreCourseStatus)
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* <div>
            <label className={labelClass}>Display order</label>

            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={form.sortOrder}
              onChange={(event) =>
                updateField("sortOrder", Number(event.target.value))
              }
            />
          </div> */}
        </section>

        {/* Submit */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update course"
                : "Create course"}
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

      {validationError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
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

      {/* Courses list */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Courses</h2>

            <p className="mt-1 text-sm text-zinc-500">
              {totalCourses} course{totalCourses === 1 ? "" : "s"} total
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses..."
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
              onClick={() => {
                pageCache.current.clear();
                void loadPage(currentPage, debouncedSearch, true);
                void loadReferenceData();
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-zinc-100"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">
              {debouncedSearch
                ? `No courses found matching "${debouncedSearch}".`
                : "No courses yet."}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {debouncedSearch
                ? "Try searching with another course name."
                : "Create your first course using the form above."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    {[
                      "Course",
                      "Category",
                      "Institute",
                      "Area",
                      "Duration",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {courses.map((course) => (
                    <tr
                      key={course._id}
                      className="transition-colors hover:bg-zinc-50/70"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-zinc-900">
                          {course.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {course.slug}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {getReferenceName(course.courseCategory)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {getReferenceName(course.institute)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {getReferenceName(course.area)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {course.duration.value} {course.duration.unit}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize ${
                            course.status === "published"
                              ? "border-green-400 bg-green-50 text-green-500"
                              : "border-zinc-200 bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(course)}
                            className="cursor-pointer rounded-md p-2 text-orange-600 hover:bg-orange-50"
                            title="Edit course"
                          >
                            <Pencil className="size-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setCourseToDelete(course);
                            }}
                            className="cursor-pointer rounded-md p-2 text-red-500 hover:bg-red-50"
                            title="Delete course"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
              <p className="text-sm text-zinc-500">
                Page {currentPage} of {Math.max(totalPages, 1)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || pageLoading}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || pageLoading}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Delete confirmation */}
      {courseToDelete && (
        <ConfirmDeleteModal
          open={!!courseToDelete}
          title="Delete course"
          //   message={`Are you sure you want to delete "${courseToDelete.name}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (!isDeleting) {
              setCourseToDelete(null);
              setDeleteError("");
            }
          }}
          onConfirm={deleteCourse}
        />
      )}
    </div>
  );
}
