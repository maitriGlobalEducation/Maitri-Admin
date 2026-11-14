import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";

export async function GET(request: Request) {
  try {
    const { admin } = await authorizeAdmin();

    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";

    const shouldPaginate =
      searchParams.has("page") ||
      searchParams.has("limit") ||
      searchParams.has("search");

    const filter: Record<string, unknown> = admin
      ? {}
      : { status: "published" };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { slug: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Preserve the existing non-paginated API response.
    if (!shouldPaginate) {
      const scholarships = await Scholarship.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: scholarships,
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10),
    );

    const skip = (page - 1) * limit;

    const [scholarships, total] = await Promise.all([
      Scholarship.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Scholarship.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: scholarships,
      pagination: {
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET SCHOLARSHIPS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch scholarships",
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

    const {
      title,
      description,
      amount,
      logo,
      slug,
      cardImage,
      wallpaper,
      deadline,
      content,
      applicationForm,
      ctaLabel,
      ctaUrl,
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      status,
      featured,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 },
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, message: "Slug is required" },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Scholarship content is required" },
        { status: 400 },
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    const existingScholarship = await Scholarship.findOne({
      slug: normalizedSlug,
    });

    if (existingScholarship) {
      return NextResponse.json(
        {
          success: false,
          message: "A scholarship with this slug already exists",
        },
        { status: 409 },
      );
    }

    const scholarship = await Scholarship.create({
      title: title.trim(),
      description: description ?? "",
      amount: amount ?? null,
      logo: logo ?? null,
      slug: normalizedSlug,

      cardImage: cardImage ?? null,
      wallpaper: wallpaper ?? null,

      deadline: deadline ? new Date(deadline) : null,
      content,
      applicationForm: applicationForm ?? { fields: [] },

      ctaLabel: ctaLabel ?? "Learn More",
      ctaUrl: ctaUrl ?? "",

      metaTitle: metaTitle ?? "",
      metaDescription: metaDescription ?? "",
      metaKeywords: metaKeywords ?? [],
      focusKeyword: focusKeyword ?? "",

      status: status ?? "draft",
      featured: featured ?? false,
    });

    await revalidatePublicpage();

    return NextResponse.json(
      {
        success: true,
        data: scholarship,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE SCHOLARSHIP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create scholarship",
      },
      { status: 500 },
    );
  }
}
