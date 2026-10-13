import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import BlogCategory from "@/models/BlogCategory";
import { getAuthenticatedAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function createSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function authorize() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const authError = await authorize();
    if (authError) return authError;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required." },
        { status: 400 },
      );
    }

    if (name.length > 80 || description.length > 300) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name or description is too long.",
        },
        { status: 400 },
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Invalid category name." },
        { status: 400 },
      );
    }

    await connectDB();

    const duplicate = await BlogCategory.findOne({
      _id: { $ne: id },
      $or: [
        { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } },
        { slug },
      ],
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Another category already uses this name.",
        },
        { status: 409 },
      );
    }

    const category = await BlogCategory.findByIdAndUpdate(
      id,
      { name, slug, description },
      { new: true, runValidators: true },
    );

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "This category already exists." },
        { status: 409 },
      );
    }

    console.error("UPDATE BLOG CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update category." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const authError = await authorize();
    if (authError) return authError;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const category = await BlogCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE BLOG CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete category." },
      { status: 500 },
    );
  }
}
