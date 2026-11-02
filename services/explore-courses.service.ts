import type { ExploreCourse } from "@/types/explore-course";

export type CoursePage = {
  courses: ExploreCourse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getCoursesPage(
  page = 1,
  search = "",
  signal?: AbortSignal,
): Promise<CoursePage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "10",
    search,
  });

  const response = await fetch(
    `/api/cms/explore/courses?${params.toString()}`,
    { signal },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load courses.");
  }

  return result;
}
