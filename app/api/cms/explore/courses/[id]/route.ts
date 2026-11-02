import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { authorizeAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { revalidatePublicpage } from "@/services/revalidation.service";

import ExploreCourse from "@/models/ExploreCourse";

import {
  flattenCourseReferences,
  getCoursePayload,
  validateCourseReferences,
} from "@/lib/explore-course-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const populateCourse = (query: any) =>
  query
    .populate("courseCategory.categoryId", "name slug")
    .populate("area.areaId", "name slug")
    .populate("institute.instituteId", "name slug")
    .populate("campusOfferings.campus.campusId", "name slug city country");

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const course = await populateCourse(ExploreCourse.findById(id)).lean();

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      course: flattenCourseReferences(course as Record<string, unknown>),
    });
  } catch (error) {
    console.error("GET course error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch course." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID." },
        { status: 400 },
      );
    }

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

    const references = await validateCourseReferences(payload.data);

    if (references.error || !references.data) {
      return NextResponse.json(
        { success: false, message: references.error },
        { status: 400 },
      );
    }

    const duplicate = await ExploreCourse.findOne({
      slug: payload.data.slug,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    const course = await populateCourse(
      ExploreCourse.findByIdAndUpdate(
        id,
        {
          $set: {
            ...payload.data,
            ...references.data,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ),
    ).lean();

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      course: flattenCourseReferences(course as Record<string, unknown>),
    });
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

    console.error("PUT course error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update course." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const course = await ExploreCourse.findByIdAndDelete(id);

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE course error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete course." },
      { status: 500 },
    );
  }
}
