import type { ExploreInstitute } from "@/types/explore-institute";
import type { SelectOption } from "@/components/cms/explore/SearchableMultiSelect";

export type InstituteRecord = Omit<
  ExploreInstitute,
  "areas" | "brands" | "campuses"
> & {
  areas: (string | SelectOption)[];
  brands: (string | SelectOption)[];
  campuses: (string | SelectOption)[];
};

export type InstitutePage = {
  institutes: InstituteRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getInstitutesPage(
  page: number,
  search = "",
  signal?: AbortSignal,
): Promise<InstitutePage> {
  const params = new URLSearchParams({
    page: String(page),
    search,
  });

  const response = await fetch(
    `/api/cms/explore/institutes/list?${params.toString()}`,
    {
      method: "GET",
      signal,
      cache: "no-store",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load institutes.");
  }

  return {
    institutes: result.institutes ?? [],
    pagination: result.pagination,
  };
}
