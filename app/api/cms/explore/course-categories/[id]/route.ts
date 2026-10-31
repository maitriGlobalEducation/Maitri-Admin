import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreCourseCategory from "@/models/ExploreCourseCategory";
import { cleanText } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();
    const name = cleanText(body.name);

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Course category name is required." },
        { status: 400 },
      );
    }

    const courseCategory = await ExploreCourseCategory.findByIdAndUpdate(
      id,
      { $set: { name } },
      { new: true, runValidators: true },
    );

    if (!courseCategory) {
      return NextResponse.json(
        { success: false, message: "Course category not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true, courseCategory });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A course category with this name already exists.",
        },
        { status: 409 },
      );
    }

    console.error("PUT course category:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update course category." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const courseCategory = await ExploreCourseCategory.findByIdAndDelete(id);

    if (!courseCategory) {
      return NextResponse.json(
        { success: false, message: "Course category not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE course category:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete course category." },
      { status: 500 },
    );
  }
}
