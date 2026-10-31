import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreCourseCategory from "@/models/ExploreCourseCategory";
import { cleanText } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    const courseCategories = await ExploreCourseCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, courseCategories });
  } catch (error) {
    console.error("GET course categories:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load course categories." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    const body = await request.json();
    const name = cleanText(body.name);

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Course category name is required." },
        { status: 400 },
      );
    }

    const courseCategory = await ExploreCourseCategory.create({ name });

    await revalidatePublicpage();

    return NextResponse.json(
      { success: true, courseCategory },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A course category with this name already exists.",
        },
        { status: 409 },
      );
    }

    console.error("POST course category:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create course category." },
      { status: 500 },
    );
  }
}
