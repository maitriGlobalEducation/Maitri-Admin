import { NextResponse } from "next/server";
import Homepage from "@/models/Homepage";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    await connectDB();

    const homepage = await Homepage.findOne();

    return NextResponse.json({
      success: true,
      data: homepage,
    });
  } catch (error) {
    console.error("Failed to fetch homepage:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch homepage" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();
    const { hero, sections, seo } = body;

    if (
      !hero ||
      typeof hero.heading !== "string" ||
      typeof hero.subtitle !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid homepage data" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(hero.overlayOpacity) ||
      hero.overlayOpacity < 0 ||
      hero.overlayOpacity > 100
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid overlay opacity" },
        { status: 400 },
      );
    }

    if (sections !== undefined && !Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, message: "Invalid homepage sections" },
        { status: 400 },
      );
    }

    if (
      seo !== undefined &&
      (typeof seo.metaTitle !== "string" ||
        typeof seo.metaDescription !== "string" ||
        !Array.isArray(seo.metaKeywords) ||
        !seo.metaKeywords.every(
          (keyword: unknown) => typeof keyword === "string",
        ) ||
        typeof seo.focusKeyword !== "string")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid homepage SEO data" },
        { status: 400 },
      );
    }

    const video = hero.backgroundVideo;

    if (
      video !== null &&
      video !== undefined &&
      (typeof video.url !== "string" || typeof video.publicId !== "string")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid background video data" },
        { status: 400 },
      );
    }

    const update: Record<string, unknown> = {
      hero: {
        ...hero,
        backgroundVideo: video ?? null,
      },
    };

    if (sections !== undefined) {
      update.sections = sections;
    }

    if (seo !== undefined) {
      update.seo = {
        metaTitle: seo.metaTitle.trim(),
        metaDescription: seo.metaDescription.trim(),
        metaKeywords: [
          ...new Set(
            seo.metaKeywords
              .map((keyword: string) => keyword.trim())
              .filter(Boolean),
          ),
        ],
        focusKeyword: seo.focusKeyword.trim(),
      };
    }

    let homepage = await Homepage.findOne();

    if (!homepage) {
      homepage = new Homepage(update);
    } else {
      homepage.set(update);
    }

    await homepage.save();

    const publicSiteUrl = process.env.PUBLIC_SITE_URL;
    const revalidationSecret = process.env.REVALIDATION_SECRET;

    if (publicSiteUrl && revalidationSecret) {
      try {
        const response = await fetch(`${publicSiteUrl}/api/revalidate`, {
          method: "POST",
          headers: {
            "x-revalidation-secret": revalidationSecret,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error(
            "Public homepage revalidation failed:",
            response.status,
          );
        }
      } catch (error) {
        console.error("Could not contact public website:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: homepage,
      message: "Homepage saved successfully",
    });
  } catch (error) {
    console.error("Failed to save homepage:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save homepage" },
      { status: 500 },
    );
  }
}
