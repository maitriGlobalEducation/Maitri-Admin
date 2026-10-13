import type { Homepage } from "@/types/homepage";

interface HomepageResponse {
  success: boolean;
  data: Homepage | null;
  message?: string;
}

export async function getHomepage(): Promise<Homepage | null> {
  const response = await fetch("/api/cms/homepage");
  const result: HomepageResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message ?? "Failed to fetch homepage");
  }

  return result.data;
}

export async function updateHomepage(homepage: Homepage): Promise<Homepage> {
  const response = await fetch("/api/cms/homepage", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(homepage),
  });

  const result: HomepageResponse = await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message ?? "Failed to save homepage");
  }

  return result.data;
}
