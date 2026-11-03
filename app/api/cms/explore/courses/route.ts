import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import ExploreCourse from "@/models/ExploreCourse";
import ExploreArea from "@/models/ExploreArea";
import ExploreInstitute from "@/models/ExploreInstitute";
import ExploreCampus from "@/models/ExploreCampus";
import ExploreCourseCategory from "@/models/ExploreCourseCategory";

import {
  getPaginationParams,
  paginationResponse,
  escapeRegex,
} from "@/lib/explore-pagination";
import { authorizeAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import {
  flattenCourseReferences,
  getCoursePayload,
  validateCourseReferences,
} from "@/lib/explore-course-validation";
import { revalidatePublicpage } from "@/services/revalidation.service";
import { validateScholarshipReferences } from "@/lib/validateScholarshipReferences";

export async function GET(request: NextRequest) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const { page, limit, search, skip } = getPaginationParams(request);
    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      const [instituteIds, areaIds, categoryIds] = await Promise.all([
        ExploreInstitute.find({ name: regex }).distinct("_id"),
        ExploreArea.find({ name: regex }).distinct("_id"),
        ExploreCourseCategory.find({ name: regex }).distinct("_id"),
      ]);

      filter.$or = [
        { name: regex },
        { slug: regex },
        { "institute.instituteId": { $in: instituteIds } },
        { "area.areaId": { $in: areaIds } },
        { "courseCategory.categoryId": { $in: categoryIds } },
      ];
    }

    const [courses, total] = await Promise.all([
      ExploreCourse.find(filter)
        .populate("courseCategory.categoryId", "name slug")
        .populate("area.areaId", "name slug")
        .populate("institute.instituteId", "name slug")
        .populate("campusOfferings.campus.campusId", "name slug city country")
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      ExploreCourse.countDocuments(filter),
    ]);

    const formattedCourses = courses.map((course) =>
      flattenCourseReferences(course as Record<string, unknown>),
    );

    return NextResponse.json({
      success: true,
      courses: formattedCourses,
      pagination: paginationResponse(page, limit, total),
    });
  } catch (error) {
    console.error("GET courses error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch courses." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = getCoursePayload(body);

    if (payload.error || !payload.data) {
      return NextResponse.json(
        { success: false, message: payload.error },
        { status: 400 },
      );
    }

    const scholarshipReferences = await validateScholarshipReferences(
      payload.data.scholarships ?? [],
    );

    if (scholarshipReferences.error || !scholarshipReferences.data) {
      return NextResponse.json(
        {
          success: false,
          message: scholarshipReferences.error,
        },
        { status: 400 },
      );
    }

    const references = await validateCourseReferences(payload.data);

    if (references.error || !references.data) {
      return NextResponse.json(
        { success: false, message: references.error },
        { status: 400 },
      );
    }

    const course = await ExploreCourse.create({
      ...payload.data,
      ...references.data,
      scholarships: scholarshipReferences.data,
    });

    const populatedCourse = await ExploreCourse.findById(course._id)
      .populate("courseCategory.categoryId", "name slug")
      .populate("area.areaId", "name slug")
      .populate("institute.instituteId", "name slug")
      .populate("campusOfferings.campus.campusId", "name slug city country")
      .lean();

    await revalidatePublicpage();

    return NextResponse.json(
      {
        success: true,
        course: populatedCourse
          ? flattenCourseReferences(populatedCourse as Record<string, unknown>)
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { success: false, message: "Invalid course data." },
        { status: 400 },
      );
    }

    console.error("POST course error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create course." },
      { status: 500 },
    );
  }
}
