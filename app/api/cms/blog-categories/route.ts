import { NextRequest, NextResponse } from "next/server";
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

function errorResponse(error: unknown) {
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

  console.error("BLOG CATEGORIES API ERROR:", error);

  return NextResponse.json(
    { success: false, message: "Something went wrong." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const categories = await BlogCategory.find().sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
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

    if (name.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name cannot exceed 80 characters.",
        },
        { status: 400 },
      );
    }

    if (description.length > 300) {
      return NextResponse.json(
        {
          success: false,
          message: "Description cannot exceed 300 characters.",
        },
        { status: 400 },
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid category name.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingCategory = await BlogCategory.findOne({
      $or: [
        { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } },
        { slug },
      ],
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this name already exists.",
        },
        { status: 409 },
      );
    }

    const category = await BlogCategory.create({
      name,
      slug,
      description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully.",
        category,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
