import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import ExploreCategory from "@/models/ExploreCategory";
import { revalidatePublicpage } from "@/services/revalidation.service";

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

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

export async function GET() {
  try {
    const { admin } = await authorizeAdmin();

    await connectDB();

    const filter = admin ? {} : { status: "published" };

    const categories = await ExploreCategory.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("GET EXPLORE CATEGORIES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Explore categories.",
      },
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

    const title = typeof body.title === "string" ? body.title.trim() : "";

    const slug = typeof body.slug === "string" ? normalizeSlug(body.slug) : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title) {
      return NextResponse.json(
        { success: false, message: "Category title is required." },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Category slug is required." },
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

    const existing = await ExploreCategory.findOne({ slug }).lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "An Explore category with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const parsedOrder = Number(body.sortOrder ?? 0);

    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Display order must be a non-negative integer.",
        },
        { status: 400 },
      );
    }

    const category = await ExploreCategory.create({
      title,
      slug,
      description,
      metaTitle: body.metaTitle ?? "",
      metaDescription: body.metaDescription ?? "",
      metaKeywords: normalizeKeywords(body.metaKeywords),
      focusKeyword: body.focusKeyword ?? "",
      sortOrder: parsedOrder,
      status: body.status ?? "draft",
    });

    await revalidatePublicpage();

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE EXPLORE CATEGORY ERROR:", error);

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
        message: "Failed to create Explore category.",
      },
      { status: 500 },
    );
  }
}
