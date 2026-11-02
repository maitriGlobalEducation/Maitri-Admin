import { NextRequest, NextResponse } from "next/server";
import ExploreBrand from "@/models/ExploreBrand";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";
import {
  escapeRegex,
  getPaginationParams,
  paginationResponse,
} from "@/lib/explore-pagination";
import { createSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const { page, limit, search, skip } = getPaginationParams(request);

    const isPaginated = new URL(request.url).searchParams.has("page");

    if (!isPaginated) {
      const brands = await ExploreBrand.find().sort({ createdAt: -1 }).lean();

      return NextResponse.json({ success: true, brands });
    }

    const filter = search
      ? { name: { $regex: escapeRegex(search), $options: "i" } }
      : {};

    const [brands, total] = await Promise.all([
      ExploreBrand.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExploreBrand.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      brands,
      pagination: paginationResponse(page, limit, total),
    });
  } catch (error) {
    console.error("GET EXPLORE BRANDS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch brands." },
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

    const name = cleanText(body.name);
    const image = validImage(body.image);
    const slug = createSlug(cleanText(body.slug) || name);

    if (!name || !image || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, image and a valid slug are required.",
        },
        { status: 400 },
      );
    }

    const existingSlug = await ExploreBrand.findOne({ slug });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    const brand = await ExploreBrand.create({ name, slug, image });

    await revalidatePublicpage();

    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A brand with this name or slug already exists.",
        },
        { status: 409 },
      );
    }

    console.error("CREATE EXPLORE BRAND ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create brand." },
      { status: 500 },
    );
  }
}
