"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { SelectOption } from "@/components/cms/explore/SearchableMultiSelect";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

import {
  COURSE_INTAKES,
  COURSE_LANGUAGES,
  ExploreCourseStatus,
  type CourseCampusOfferingInput,
  type CourseIntake,
  type CourseLanguage,
  type ExploreCourse,
  type ExploreCourseInput,
} from "@/types/explore-course";

import {
  getCoursesPage,
  type CoursePage,
} from "@/services/explore-courses.service";
import { formatDate } from "@/helpers/date";
import CourseForm from "./CoursesForm";
import StatusSwitch, {
  StatusType,
} from "@/components/Common Components/StatusSwitch";
import DataTable from "@/components/Common Components/DataTable";
import { DataTableColumn } from "@/types/dataTable";

type CourseScholarshipReference = {
  scholarshipId: string;
  slug: string;
};

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
  "courseCategory" | "area" | "institute" | "campusOfferings" | "scholarships"
> & {
  courseCategory: string | SelectOption;
  area: string | SelectOption;
  institute: string | SelectOption;
  fees?: number;
  scholarships?: Array<string | CourseScholarshipReference>;
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
  // const [manualSlug, setManualSlug] = useState(false);

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
    setError("");
  }

  function handleInstituteChange(instituteId: string) {
    updateField("institute", instituteId);
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
          typeof scholarship === "string"
            ? scholarship
            : scholarship.scholarshipId,
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

  async function handleSubmit(
    event?: React.FormEvent<HTMLFormElement>,
    statusOverride?: ExploreCourseStatus,
  ) {
    event?.preventDefault();
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
        ...(statusOverride ? { status: statusOverride } : {}),
        fees: `${feeCurrency} ${form.fees}`,
        scholarships: form.scholarships.map((scholarshipId) => {
          const scholarship = scholarships.find(
            (item) => item._id === scholarshipId,
          );

          if (!scholarship?.slug) {
            throw new Error("Unable to find the selected scholarship slug.");
          }

          return {
            scholarshipId: scholarship._id,
            slug: scholarship.slug,
          };
        }),
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

  async function handleStatusChange(courseId: string, newStatus: StatusType) {
    try {
      const response = await fetch(`/api/cms/explore/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update course status.");
      }

      toast.success(
        `Course ${newStatus === "published" ? "published" : "moved to draft"} successfully.`,
      );

      pageCache.current.clear();

      await loadPage(currentPage, debouncedSearch, true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update course status.";

      toast.error(message);
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

  type CourseRow = (typeof courses)[number];

  const courseColumns: DataTableColumn<CourseRow>[] = [
    {
      key: "course",
      header: "Course",
      render: (course) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-900">{course.name}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(course.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (course) => (
        <span className="text-xs text-zinc-600">
          {getReferenceName(course.courseCategory)}
        </span>
      ),
    },
    {
      key: "institute",
      header: "Institute",
      render: (course) => (
        <span className="text-xs text-zinc-600">
          {getReferenceName(course.institute)}
        </span>
      ),
    },
    {
      key: "area",
      header: "Area",
      render: (course) => (
        <span className="text-xs text-zinc-600">
          {getReferenceName(course.area)}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cellClassName: "whitespace-nowrap",
      render: (course) => (
        <span className="text-xs text-zinc-600">
          {course.duration.value} {course.duration.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      render: (course) => (
        <StatusSwitch
          status={course.status}
          size="sm"
          onChange={(newStatus) => handleStatusChange(course._id, newStatus)}
        />
      ),
    },
  ];

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
      <CourseForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        feeCurrency={feeCurrency}
        setFeeCurrency={setFeeCurrency}
        categories={categories}
        institutes={institutes}
        areas={areas}
        scholarships={scholarships}
        campuses={campuses}
        intakeOptions={intakeOptions}
        courseLanguages={[...COURSE_LANGUAGES]}
        onSubmit={handleSubmit}
        onReset={resetForm}
        onCancelEdit={resetForm}
        onInstituteChange={handleInstituteChange}
      />

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
      <DataTable
        columns={courseColumns}
        data={courses}
        getRowKey={(course) => course._id}
        loading={loading || pageLoading}
        toolbar={{
          title: `Courses (${totalCourses})`,
          description: "Manage your courses",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Search courses...",
          refreshing: pageLoading,
          onRefresh: () => {
            pageCache.current.clear();
            void loadPage(currentPage, debouncedSearch, true);
            void loadReferenceData();
          },
        }}
        emptyState={
          <div className="py-2 text-center">
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
        }
        minWidth="900px"
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        actions={{
          onEdit: startEdit,
          onDelete: (course) => {
            setDeleteError("");
            setCourseToDelete(course);
          },
          editTitle: "Edit Course",
          deleteTitle: "Delete Course",
        }}
      />

      {/* Delete confirmation */}
      {courseToDelete && (
        <ConfirmDeleteModal
          open={!!courseToDelete}
          itemName={courseToDelete?.name}
          title="Delete course"
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
