"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { University } from "@/types/university";
import UniversityForm from "./UniversityForm";
import { statusDotStyles, statusStyles } from "@/lib/styles/publishStatusStyle";

interface UniversityManagerProps {
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
}

export default function UniversityManager({
  isVisible,
  onVisibilityChange,
}: UniversityManagerProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] =
    useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/cms/universities");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch universities");
      }

      setUniversities(result.data);
    } catch (error) {
      console.error("FETCH UNIVERSITIES ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch universities",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUniversities();
  }, [fetchUniversities]);

  const handleSuccess = () => {
    setSelectedUniversity(null);
    void fetchUniversities();
  };

  const handleDelete = async (university: University) => {
    const confirmed = window.confirm(
      `Delete "${university.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setBusyId(university._id);

    try {
      const response = await fetch(`/api/cms/universities/${university._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete university");
      }

      if (selectedUniversity?._id === university._id) {
        setSelectedUniversity(null);
      }

      toast.success("University deleted successfully");
      await fetchUniversities();
    } catch (error) {
      console.error("DELETE UNIVERSITY ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete university",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (university: University) => {
    const status = university.status === "published" ? "draft" : "published";

    setBusyId(university._id);

    try {
      const response = await fetch(`/api/cms/universities/${university._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update status");
      }

      toast.success(
        status === "published"
          ? "University published"
          : "University moved to drafts",
      );

      await fetchUniversities();
    } catch (error) {
      console.error("UNIVERSITY STATUS ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            Show Universities Section
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Control whether this section appears on the homepage.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isVisible}
          aria-label="Show Universities Section"
          onClick={() => onVisibilityChange(!isVisible)}
          className={`relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
            isVisible ? "bg-zinc-900" : "bg-zinc-300"
          }`}
        >
          <span
            className={`pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
              isVisible ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <section>
        <UniversityForm
          key={selectedUniversity?._id ?? "new-university"}
          university={selectedUniversity}
          onSuccess={handleSuccess}
          onCancel={() => setSelectedUniversity(null)}
        />
      </section>

      {/* Existing universities */}
      <section className="space-y-4 border-t border-zinc-200 pt-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Existing Universities
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Edit, publish, or delete university cards displayed on the homepage.
          </p>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-zinc-500">
            Loading universities...
          </div>
        ) : universities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center">
            <h4 className="font-medium text-zinc-900">No universities yet</h4>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first university using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">University</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {universities.map((university) => (
                  <tr key={university._id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {university.logo?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={university.logo.url}
                            alt=""
                            className="size-11 rounded-lg border border-zinc-200 bg-white object-contain p-1"
                          />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500">
                            {university.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900">
                            {university.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {university.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-zinc-600">
                      {university.country}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          statusStyles[university.status] ??
                          "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            statusDotStyles[university.status] ?? "bg-gray-400"
                          }`}
                        />
                        {university.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === university._id}
                          onClick={() => setSelectedUniversity(university)}
                          className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={busyId === university._id}
                          onClick={() => void handleToggleStatus(university)}
                          className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {university.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === university._id}
                          onClick={() => void handleDelete(university)}
                          className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
