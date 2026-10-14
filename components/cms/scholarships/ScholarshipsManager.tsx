"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { Scholarship } from "@/types/scholarship";

import ScholarshipForm from "./ScholarshipForm";
import { toast } from "react-toastify";

export default function ScholarshipsManager() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [selectedScholarship, setSelectedScholarship] =
    useState<Scholarship | null>(null);

  const [scholarshipToDelete, setScholarshipToDelete] =
    useState<Scholarship | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchScholarships = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/cms/scholarships");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to fetch scholarships");
      }

      setScholarships(result.data);
    } catch (error) {
      console.error("FETCH SCHOLARSHIPS ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to fetch scholarships",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Scholarships
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage scholarships and their application forms.
          </p>
        </div>
      </div>
      <section>
        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            Loading scholarships...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-600">
            {error}
          </div>
        ) : scholarships.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No scholarships yet
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Create your first scholarship above.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Scholarship
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Deadline
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Form Fields
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {scholarships.map((scholarship) => (
                    <tr
                      key={scholarship._id}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {scholarship.cardImage ? (
                            <img
                              src={scholarship.cardImage.url}
                              alt=""
                              className="h-12 w-16 rounded-lg border border-zinc-200 object-cover"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-lg bg-zinc-100" />
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-800">
                              {scholarship.title}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-zinc-400">
                              /{scholarship.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-zinc-600">
                        {formatDate(scholarship.deadline)}
                      </td>

                      <td className="px-5 py-4 text-sm text-zinc-600">
                        {scholarship.applicationForm?.fields?.length ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            scholarship.status === "published"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-500"
                              : "bg-amber-100 text-amber-600 border border-amber-500"
                          } capitalize`}
                        >
                          {scholarship.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(scholarship)}
                            className="cursor-pointer rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                            title="Edit scholarship"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setScholarshipToDelete(scholarship)}
                            className="cursor-pointer rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete scholarship"
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
