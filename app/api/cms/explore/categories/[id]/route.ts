import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import ExploreCategory from "@/models/ExploreCategory";
import { revalidatePublicpage } from "@/services/revalidation.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";

    const slug =
      typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

    if (!title || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category title and slug are required.",
        },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Slug must contain lowercase letters, numbers, and hyphens only.",
        },
        { status: 400 },
      );
    }

    if (
      body.status !== undefined &&
      !["draft", "published"].includes(body.status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid publication status." },
        { status: 400 },
      );
    }

    const sortOrder = Number(body.sortOrder ?? 0);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Display order must be a non-negative integer.",
        },
        { status: 400 },
      );
    }

    const duplicate = await ExploreCategory.findOne({
      slug,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "An Explore category with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const category = await ExploreCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          slug,
          description:
            typeof body.description === "string" ? body.description.trim() : "",
          metaTitle: body.metaTitle ?? "",
          metaDescription: body.metaDescription ?? "",
          metaKeywords: normalizeKeywords(body.metaKeywords),
          focusKeyword: body.focusKeyword ?? "",
          sortOrder,
          status: body.status ?? "draft",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("UPDATE EXPLORE CATEGORY ERROR:", error);

    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "That category slug is already in use.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update Explore category.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const category = await ExploreCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "Explore category deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE EXPLORE CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete Explore category.",
      },
      { status: 500 },
    );
  }
}
