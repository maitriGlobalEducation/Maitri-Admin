import mongoose from "mongoose";

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

type ReferenceDocument = {
  _id: mongoose.Types.ObjectId;
  slug: string;
};

async function validateIds<T extends ReferenceDocument>(
  value: unknown,
  label: string,
  findDocuments: (ids: string[]) => Promise<T[]>,
  required = false,
): Promise<{ documents: T[] | null; error: string | null }> {
  if (!Array.isArray(value)) {
    return {
      documents: null,
      error: `${label} must be an array.`,
    };
  }

  if (required && value.length === 0) {
    return {
      documents: null,
      error: `Select at least one ${label.toLowerCase()}.`,
    };
  }

  const ids = value.filter(
    (id): id is string =>
      typeof id === "string" && mongoose.isValidObjectId(id),
  );

  if (ids.length !== value.length) {
    return {
      documents: null,
      error: `One or more ${label.toLowerCase()} IDs are invalid.`,
    };
  }

  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length !== ids.length) {
    return {
      documents: null,
      error: `Duplicate ${label.toLowerCase()} selections are not allowed.`,
    };
  }

  if (!uniqueIds.length) {
    return { documents: [], error: null };
  }

  const documents = await findDocuments(uniqueIds);

  if (documents.length !== uniqueIds.length) {
    return {
      documents: null,
      error: `One or more selected ${label.toLowerCase()} do not exist.`,
    };
  }

  // Preserve the order in which the IDs were selected.
  const documentsById = new Map(
    documents.map((document) => [document._id.toString(), document]),
  );

  const orderedDocuments = uniqueIds.map((id) => documentsById.get(id));

  if (orderedDocuments.some((document) => !document)) {
    return {
      documents: null,
      error: `Unable to validate selected ${label.toLowerCase()}.`,
    };
  }

  return {
    documents: orderedDocuments as T[],
    error: null,
  };
}

function extractReferenceIds(
  value: unknown,
  key: "areaId" | "brandId" | "campusId",
): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((reference) => {
    if (typeof reference === "string") return reference;

    if (reference && typeof reference === "object" && key in reference) {
      return reference[key];
    }

    return reference;
  });
}

export async function validateInstituteReferences(
  body: Record<string, unknown>,
) {
  const extractIds = (references: unknown): string[] => {
    if (!Array.isArray(references)) return [];

    return references
      .map((reference) => {
        if (typeof reference === "string") return reference;

        if (
          reference &&
          typeof reference === "object" &&
          "areaId" in reference
        ) {
          return String(reference.areaId);
        }

        if (
          reference &&
          typeof reference === "object" &&
          "brandId" in reference
        ) {
          return String(reference.brandId);
        }

        if (
          reference &&
          typeof reference === "object" &&
          "campusId" in reference
        ) {
          return String(reference.campusId);
        }

        return "";
      })
      .filter(Boolean);
  };

  const [areas, brands, campuses] = await Promise.all([
    validateIds(
      extractReferenceIds(body.areas ?? [], "areaId"),
      "Areas",
      (ids) =>
        ExploreArea.find({ _id: { $in: ids } })
          .select("_id slug")
          .lean(),
    ),

    validateIds(
      extractReferenceIds(body.brands ?? [], "brandId"),
      "Brands",
      (ids) =>
        ExploreBrand.find({ _id: { $in: ids } })
          .select("_id slug")
          .lean(),
    ),

    validateIds(
      extractReferenceIds(body.campuses ?? [], "campusId"),
      "Campuses",
      (ids) =>
        ExploreCampus.find({ _id: { $in: ids } })
          .select("_id slug")
          .lean(),
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
      areas: areas.documents!.map((area) => ({
        areaId: area._id,
        slug: area.slug,
      })),

      brands: brands.documents!.map((brand) => ({
        brandId: brand._id,
        slug: brand.slug,
      })),

      campuses: campuses.documents!.map((campus) => ({
        campusId: campus._id,
        slug: campus.slug,
      })),
    },
    error: null,
  };
}

export function getInstitutePayload(body: Record<string, unknown>) {
  const name = cleanString(body.name);
  const slug = cleanString(body.slug).toLowerCase();
  const status = body.status;
  const sortOrder = Number(body.sortOrder ?? 0);

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!name) {
    return {
      data: null,
      error: "Institute name is required.",
    };
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
    return {
      data: null,
      error: "A valid institute logo is required.",
    };
  }

  const content = body.content;

  if (!isTipTapDocument(content)) {
    return {
      data: null,
      error: "Invalid institute content. Please check the content editor.",
    };
  }

  return {
    data: {
      name,
      slug,
      shortDescription: cleanString(body.shortDescription),
      logo,
      banner,
      overview: cleanString(body.overview),
      content,
      metaTitle: cleanString(body.metaTitle),
      metaDescription: cleanString(body.metaDescription),
      metaKeywords: cleanKeywords(body.metaKeywords),
      focusKeyword: cleanString(body.focusKeyword),
      sortOrder,
      status,
      featured: body.featured === true,
    },
    error: null,
  };
}
