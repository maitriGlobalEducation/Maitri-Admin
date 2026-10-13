import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { authorizeAdmin } from "@/lib/api-auth";

const allowedFolders = {
  blogs: "maitri/blogs",
  universities: "maitri/universities",
  scholarships: "maitri/scholarships",
  countries: "maitri/countries",
  events: "maitri/events",
  testimonials: "maitri/testimonials",
  homepage: "maitri/homepage",
  "career-choices": "maitri/career-choices",
} as const;

export async function POST(request: NextRequest) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const body = await request.json();

    const type = body.type as keyof typeof allowedFolders;

    const folder = allowedFolders[type];

    if (!folder) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid media type",
        },
        { status: 400 },
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return NextResponse.json({
      success: true,

      data: {
        signature,
        timestamp,
        folder,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      },
    });
  } catch (error) {
    console.error("CLOUDINARY SIGNATURE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate upload signature",
      },
      { status: 500 },
    );
  }
}
