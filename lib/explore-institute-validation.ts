import mongoose from "mongoose";
import ExploreCategory from "@/models/ExploreCategory";
import ExploreArea from "@/models/ExploreArea";
import ExploreBrand from "@/models/ExploreBrand";
import ExploreCampus from "@/models/ExploreCampus";

export function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanKeywords(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [
    ...new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function cleanImage(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const image = value as Record<string, unknown>;
  const url = cleanString(image.url);
  const publicId = cleanString(image.publicId);

  return url && publicId ? { url, publicId } : null;
}

export function isTipTapDocument(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const document = value as Record<string, unknown>;

  return document.type === "doc" && Array.isArray(document.content);
}

async function validateIds(
  value: unknown,
  label: string,
  countExisting: (ids: string[]) => Promise<number>,
  required = false,
): Promise<{ ids: string[] | null; error: string | null }> {
  if (!Array.isArray(value)) {
    return {
      ids: null,
      error: `${label} must be an array.`,
    };
  }

  if (required && value.length === 0) {
    return {
      ids: null,
      error: `Select at least one ${label.toLowerCase()}.`,
    };
  }

  const ids = value.filter(
    (id): id is string =>
      typeof id === "string" && mongoose.isValidObjectId(id),
  );

  if (ids.length !== value.length) {
    return {
      ids: null,
      error: `One or more ${label.toLowerCase()} IDs are invalid.`,
    };
  }

  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length !== ids.length) {
    return {
      ids: null,
      error: `Duplicate ${label.toLowerCase()} selections are not allowed.`,
    };
  }

  if (uniqueIds.length) {
    const count = await countExisting(uniqueIds);

    if (count !== uniqueIds.length) {
      return {
        ids: null,
        error: `One or more selected ${label.toLowerCase()} do not exist.`,
      };
    }
  }

  return { ids: uniqueIds, error: null };
}

export async function validateInstituteReferences(
  body: Record<string, unknown>,
) {
  const [areas, brands, campuses] = await Promise.all([
    validateIds(body.areas ?? [], "Areas", (ids) =>
      ExploreArea.countDocuments({ _id: { $in: ids } }),
    ),

    validateIds(body.brands ?? [], "Brands", (ids) =>
      ExploreBrand.countDocuments({ _id: { $in: ids } }),
    ),

    validateIds(body.campuses ?? [], "Campuses", (ids) =>
      ExploreCampus.countDocuments({ _id: { $in: ids } }),
    ),
  ]);

  const failed = [areas, brands, campuses].find((result) => result.error);

  if (failed?.error) {
    return {
      data: null,
      error: failed.error,
    };
  }

  return {
    data: {
      areas: areas.ids!,
      brands: brands.ids!,
      campuses: campuses.ids!,
    },
    error: null,
  };
}

export function getInstitutePayload(body: Record<string, unknown>) {
  const name = cleanString(body.name);
  const slug = cleanString(body.slug).toLowerCase();
  const status = body.status;
  const sortOrder = Number(body.sortOrder ?? 0);

  // Correct slug validation: the * is a quantifier, not an escaped character.
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!name) {
    return { data: null, error: "Institute name is required." };
  }

  if (!slug || !slugRegex.test(slug)) {
    return {
      data: null,
      error:
        "Enter a valid URL slug using lowercase letters, numbers and hyphens.",
    };
  }

  if (status !== "draft" && status !== "published") {
    return {
      data: null,
      error: "Status must be draft or published.",
    };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return {
      data: null,
      error: "Display order must be a non-negative integer.",
    };
  }

  const logo = cleanImage(body.logo);
  const banner = cleanImage(body.banner);

  if (!logo) {
    return { data: null, error: "A valid institute logo is required." };
  }

  const content = body.content;

  if (!isTipTapDocument(content)) {
    return {
      data: null,
      error: "Invalid institute content. Please check the content editor.",
    };
  }

  const metaTitle = cleanString(body.metaTitle);
  const metaDescription = cleanString(body.metaDescription);

  return {
    data: {
      name,
      slug,
      shortDescription: cleanString(body.shortDescription),
      logo,
      banner,
      overview: cleanString(body.overview),
      content,
      metaTitle,
      metaDescription,
      metaKeywords: cleanKeywords(body.metaKeywords),
      focusKeyword: cleanString(body.focusKeyword),
      sortOrder,
      status,
      featured: body.featured === true,
    },
    error: null,
  };
}
