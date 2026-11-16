"use client";

import { useCallback, useEffect, useState } from "react";

import type { Scholarship } from "@/types/scholarship";

import ScholarshipForm from "./ScholarshipForm";
import { toast } from "react-toastify";
import StatusSwitch, {
  StatusType,
} from "@/components/Common Components/StatusSwitch";
import DataTable from "@/components/Common Components/DataTable";
import { DataTableColumn } from "@/types/dataTable";

export default function ScholarshipsManager() {
  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScholarships, setTotalScholarships] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [selectedScholarship, setSelectedScholarship] =
    useState<Scholarship | null>(null);

  const [scholarshipToDelete, setScholarshipToDelete] =
    useState<Scholarship | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchScholarships = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setIsLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const response = await fetch(
          `/api/cms/scholarships?${params.toString()}`,
          { signal },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message ?? "Failed to fetch scholarships");
        }

        setScholarships(result.data);
        setTotalScholarships(result.pagination.total);
        setTotalPages(Math.max(1, result.pagination.totalPages));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("FETCH SCHOLARSHIPS ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch scholarships",
        );

        setScholarships([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentPage, debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchScholarships(controller.signal);

    return () => controller.abort();
  }, [fetchScholarships, refreshKey]);

  const handleSuccess = async () => {
    setSelectedScholarship(null);
    await fetchScholarships();
  };

  const handleDelete = async () => {
    if (!scholarshipToDelete) return;

    try {
      setIsDeleting(true);

      const deletePromise = (async () => {
        const response = await fetch(
          `/api/cms/scholarships/${scholarshipToDelete._id}`,
          { method: "DELETE" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message ?? "Failed to delete scholarship");
        }

        return result;
      })();

      await toast.promise(deletePromise, {
        pending: "Deleting scholarship...",
        success: "Scholarship removed",
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : "Failed to delete scholarship";
          },
        },
      });

      setScholarshipToDelete(null);
      await fetchScholarships();
    } catch (error) {
      console.error("DELETE SCHOLARSHIP ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete scholarship",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No deadline";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  async function handleScholarshipStatusChange(
    scholarshipId: string,
    newStatus: StatusType,
  ) {
    try {
      const response = await fetch(`/api/cms/scholarships/${scholarshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update scholarship status.",
        );
      }

      const updatedScholarship = result.data;

      if (!updatedScholarship?._id) {
        throw new Error("Invalid scholarship data returned.");
      }

      setScholarships((previous) =>
        previous.map((scholarship) =>
          scholarship._id === updatedScholarship._id
            ? updatedScholarship
            : scholarship,
        ),
      );

      toast.success(
        `Scholarship ${
          newStatus === "published" ? "published" : "moved to draft"
        } successfully.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update scholarship status.";

      toast.error(message);
    }
  }

  const scholarshipColumns: DataTableColumn<Scholarship>[] = [
    {
      key: "scholarship",
      header: "Scholarship",
      cellClassName: "min-w-65",
      render: (scholarship) => (
        <div className="flex items-center gap-3">
          {scholarship.cardImage ? (
            <img
              src={scholarship.cardImage.url}
              alt=""
              className="h-12 w-16 rounded-lg border border-zinc-200 object-cover"
            />
          ) : (
            <div className="h-12 w-16 shrink-0 rounded-lg bg-zinc-100" />
          )}

          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-800">
              {scholarship.title}
            </p>

            <p className="mt-0.5 truncate text-xs text-zinc-400">
              /{scholarship.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      cellClassName: "whitespace-nowrap text-zinc-600",
      render: (scholarship) => formatDate(scholarship.deadline),
    },
    {
      key: "fields",
      header: "Form Fields",
      cellClassName: "text-zinc-600",
      render: (scholarship) => scholarship.applicationForm?.fields?.length ?? 0,
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      render: (scholarship) => (
        <StatusSwitch
          status={scholarship.status}
          size="sm"
          onChange={(newStatus) =>
            handleScholarshipStatusChange(scholarship._id, newStatus)
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Form */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-950">
            {selectedScholarship ? "Edit Scholarship" : "Add Scholarship"}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {selectedScholarship
              ? "Update the scholarship details and save your changes."
              : "Add a student scholarship to the website."}
          </p>
        </div>

        {/* Form */}
        <ScholarshipForm
          scholarship={selectedScholarship}
          onSuccess={handleSuccess}
          onCancel={() => setSelectedScholarship(null)}
        />
      </div>

      {/* List */}
      <DataTable
        columns={scholarshipColumns}
        data={scholarships}
        getRowKey={(scholarship) => scholarship._id}
        loading={isLoading}
        minWidth="900px"
        toolbar={{
          title: `Scholarships (${totalScholarships})`,
          description: "Manage scholarships and their application forms.",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Search scholarships...",
          refreshing: isLoading,
          onRefresh: () => setRefreshKey((prev) => prev + 1),
        }}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        emptyState={
          error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-zinc-700">
                {debouncedSearch
                  ? "No scholarships found"
                  : "No scholarships yet"}
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {debouncedSearch
                  ? "Try searching with a different keyword."
                  : "Create your first scholarship above."}
              </p>
            </div>
          )
        }
        actions={{
          onEdit: handleEdit,
          onDelete: (scholarship) => setScholarshipToDelete(scholarship),
          editTitle: "Edit scholarship",
          deleteTitle: "Delete scholarship",
        }}
      />

      {/* Delete Confirmation */}
      {scholarshipToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setScholarshipToDelete(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              Delete scholarship?
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will permanently delete{" "}
              <span className="font-medium text-zinc-700">
                {scholarshipToDelete.title}
              </span>{" "}
              and its uploaded images.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setScholarshipToDelete(null)}
                disabled={isDeleting}
                className="h-10 cursor-pointer rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-10 cursor-pointer rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
