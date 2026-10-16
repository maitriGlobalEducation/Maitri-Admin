import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import EventCategory from "@/models/EventCategory";

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    const categories = await EventCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      categories: categories.map((category) => ({
        ...category,
        _id: category._id.toString(),
      })),
    });
  } catch (error) {
    console.error("GET EVENT CATEGORIES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch event categories." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

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
          message:
            "Name must be at most 80 characters and description at most 300 characters.",
        },
        { status: 400 },
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a name that can form a valid slug.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingCategory = await EventCategory.findOne({
      $or: [
        { slug },
        {
          name: {
            $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        },
      ],
    }).lean();

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "An event category with this name already exists.",
        },
        { status: 409 },
      );
    }

    const category = await EventCategory.create({
      name,
      slug,
      description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event category created successfully.",
        categories: undefined,
        data: {
          _id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An event category with this name already exists.",
        },
        { status: 409 },
      );
    }

    console.error("CREATE EVENT CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create event category." },
      { status: 500 },
    );
  }
}
