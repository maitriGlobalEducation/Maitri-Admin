import { NextResponse } from "next/server";
import University from "@/models/University";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicHomepage } from "@/services/revalidation.service";

export async function GET() {
  try {
    const { admin } = await authorizeAdmin();
    await connectDB();

    const filter = admin ? {} : { status: "published" };

    const universities = await University.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: universities,
    });
  } catch (error) {
    console.error("GET UNIVERSITIES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch universities" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      slug,
      country,
      logo = null,
      reportLabel = "Report",
      reportYear = "",
      title,
      description,
      ctaLabel = "Go to University Page",
      ctaUrl,
      status = "draft",
    } = body;

    if (
      !name?.trim() ||
      !slug?.trim() ||
      !country?.trim() ||
      !title?.trim() ||
      !description?.trim() ||
      !ctaUrl?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide all required university fields",
        },
        { status: 400 },
      );
    }

    const normalizedSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingUniversity = await University.findOne({
      slug: normalizedSlug,
    });

    if (existingUniversity) {
      return NextResponse.json(
        { success: false, message: "This university slug already exists" },
        { status: 409 },
      );
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid university status" },
        { status: 400 },
      );
    }

    const university = await University.create({
      name: name.trim(),
      slug: normalizedSlug,
      country: country.trim(),
      logo,
      reportLabel: reportLabel?.trim() || "Report",
      reportYear: reportYear?.toString().trim() || "",
      title: title.trim(),
      description: description.trim(),
      ctaLabel: ctaLabel?.trim() || "Go to University Page",
      ctaUrl: ctaUrl.trim(),
      status,
    });

    await revalidatePublicHomepage();

    return NextResponse.json(
      {
        success: true,
        message: "University created successfully",
        data: university,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE UNIVERSITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create university" },
      { status: 500 },
    );
  }
}
