import mongoose from "mongoose";

import ExploreArea from "@/models/ExploreArea";
import ExploreCampus from "@/models/ExploreCampus";
import ExploreInstitute from "@/models/ExploreInstitute";
import ExploreCourseCategory from "@/models/ExploreCourseCategory";

import { COURSE_INTAKES, COURSE_LANGUAGES } from "@/types/explore-course";

const DURATION_UNITS = ["days", "weeks", "months", "years"] as const;
const COURSE_STATUSES = ["draft", "published"] as const;

export function getCoursePayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug =
    typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

  const courseCategoryRef =
    typeof body.courseCategory === "object" && body.courseCategory !== null
      ? (body.courseCategory as Record<string, unknown>)
      : null;

  const areaRef =
    typeof body.area === "object" && body.area !== null
      ? (body.area as Record<string, unknown>)
      : null;

  const instituteRef =
    typeof body.institute === "object" && body.institute !== null
      ? (body.institute as Record<string, unknown>)
      : null;

  const courseCategory = courseCategoryRef?.categoryId ?? body.courseCategory;
  const area = areaRef?.areaId ?? body.area;
  const institute = instituteRef?.instituteId ?? body.institute;
  const duration = body.duration as
    | { value?: number; unit?: string }
    | undefined;

  console.log("Course references:", {
    courseCategory,
    area,
    institute,
    categoryValid: mongoose.isValidObjectId(courseCategory),
    areaValid: mongoose.isValidObjectId(area),
    instituteValid: mongoose.isValidObjectId(institute),
  });

  if (!name || !slug) {
    return { error: "Course name and slug are required." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Please provide a valid slug." };
  }

  if (
    !mongoose.isValidObjectId(courseCategory) ||
    !mongoose.isValidObjectId(area) ||
    !mongoose.isValidObjectId(institute)
  ) {
    return { error: "Please select a valid category, area, and institute." };
  }

  if (
    !duration ||
    !Number.isFinite(Number(duration.value)) ||
    Number(duration.value) < 1 ||
    !DURATION_UNITS.includes(duration.unit as (typeof DURATION_UNITS)[number])
  ) {
    return { error: "Please provide a valid course duration." };
  }

  const status = body.status ?? "draft";

  if (!COURSE_STATUSES.includes(status as (typeof COURSE_STATUSES)[number])) {
    return { error: "Invalid course status." };
  }

  const sortOrder = Number(body.sortOrder ?? 0);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: "Display order must be a non-negative integer." };
  }

  if (!Array.isArray(body.campusOfferings)) {
    return { error: "Campus offerings must be an array." };
  }

  const campusOfferings = [];

  for (const item of body.campusOfferings) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid campus offering." };
    }

    const offering = item as Record<string, unknown>;
    const campusRef =
      typeof offering.campus === "object" && offering.campus !== null
        ? (offering.campus as Record<string, unknown>)
        : null;

    const campus = campusRef?.campusId ?? offering.campus;

    if (!mongoose.isValidObjectId(campus)) {
      return { error: "Please select a valid campus." };
    }

    if (
      !Array.isArray(offering.intakes) ||
      offering.intakes.length === 0 ||
      offering.intakes.some((month) => !COURSE_INTAKES.includes(month as never))
    ) {
      return { error: "Please select valid intake months." };
    }

    if (!COURSE_LANGUAGES.includes(offering.language as never)) {
      return { error: "Please select a valid language." };
    }

    campusOfferings.push({
      campus: {
        campusId: String(campus),
        slug: String(campusRef?.slug ?? ""),
      },
      intakes: offering.intakes,
      language: offering.language,
    });
  }

  return {
    data: {
      name,
      slug,
      courseCategory: {
        categoryId: String(courseCategory),
        slug: String(courseCategoryRef?.slug ?? ""),
      },

      area: {
        areaId: String(area),
        slug: String(areaRef?.slug ?? ""),
      },

      institute: {
        instituteId: String(institute),
        slug: String(instituteRef?.slug ?? ""),
      },
      duration: {
        value: Number(duration.value),
        unit: duration.unit,
      },
      durationFeatures:
        typeof body.durationFeatures === "string"
          ? body.durationFeatures.trim()
          : "",
      campusOfferings,
      description: body.description ?? {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      status,
      sortOrder,
    },
  };
}

export async function validateCourseReferences(body: Record<string, unknown>) {
  const courseCategory =
    typeof body.courseCategory === "object" && body.courseCategory !== null
      ? (body.courseCategory as Record<string, unknown>).categoryId
      : body.courseCategory;

  const area =
    typeof body.area === "object" && body.area !== null
      ? (body.area as Record<string, unknown>).areaId
      : body.area;

  const institute =
    typeof body.institute === "object" && body.institute !== null
      ? (body.institute as Record<string, unknown>).instituteId
      : body.institute;

  const campusOfferings = Array.isArray(body.campusOfferings)
    ? body.campusOfferings
    : [];

  const [categoryExists, areaExists, instituteExists] = await Promise.all([
    ExploreCourseCategory.exists({ _id: courseCategory }),
    ExploreArea.exists({ _id: area }),
    ExploreInstitute.exists({ _id: institute }),
  ]);

  if (!categoryExists) {
    return { error: "Selected course category does not exist." };
  }

  if (!areaExists) {
    return { error: "Selected area does not exist." };
  }

  if (!instituteExists) {
    return { error: "Selected institute does not exist." };
  }

  for (const item of campusOfferings) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid campus offering." };
    }

    const offering = item as Record<string, unknown>;

    const campus =
      typeof offering.campus === "object" && offering.campus !== null
        ? (offering.campus as Record<string, unknown>).campusId
        : offering.campus;

    const campusExists = await ExploreCampus.exists({ _id: campus });

    if (!campusExists) {
      return { error: "Selected campus does not exist." };
    }
  }

  return {
    data: {
      courseCategory: body.courseCategory,
      area: body.area,
      institute: body.institute,
      campusOfferings: body.campusOfferings,
    },
  };
}

type ReferenceObject = Record<string, unknown>;

function flattenReference(
  reference: ReferenceObject | null | undefined,
  referenceKey: string,
) {
  if (!reference || typeof reference !== "object") {
    return reference;
  }

  const populatedReference = reference[referenceKey];

  if (
    populatedReference &&
    typeof populatedReference === "object" &&
    !Array.isArray(populatedReference)
  ) {
    return {
      ...(populatedReference as ReferenceObject),
      // Keep the slug stored in the relationship.
      slug: reference.slug ?? (populatedReference as ReferenceObject).slug,
    };
  }

  return reference;
}

export function flattenCourseReferences<T extends ReferenceObject>(course: T) {
  const campusOfferings = Array.isArray(course.campusOfferings)
    ? course.campusOfferings
    : [];

  return {
    ...course,

    courseCategory: flattenReference(
      course.courseCategory as ReferenceObject,
      "categoryId",
    ),

    area: flattenReference(course.area as ReferenceObject, "areaId"),

    institute: flattenReference(
      course.institute as ReferenceObject,
      "instituteId",
    ),

    campusOfferings: campusOfferings.map((offering) => {
      const item = offering as ReferenceObject;

      return {
        ...item,
        campus: flattenReference(item.campus as ReferenceObject, "campusId"),
      };
    }),
  };
}
