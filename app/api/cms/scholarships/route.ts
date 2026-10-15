import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";

export async function GET() {
  try {
    const { admin } = await authorizeAdmin();

    await connectDB();

    const filter = admin ? {} : { status: "published" };

    const scholarships = await Scholarship.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: scholarships,
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
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 },
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug is required",
        },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Scholarship content is required",
        },
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
