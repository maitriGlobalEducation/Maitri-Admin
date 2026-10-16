import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import EventCategory from "@/models/EventCategory";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
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

    const category = await EventCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Event category not found." },
        { status: 404 },
      );
    }

    const duplicate = await EventCategory.findOne({
      _id: { $ne: id },
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

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "An event category with this name already exists.",
        },
        { status: 409 },
      );
    }

    category.name = name;
    category.slug = slug;
    category.description = description;

    await category.save();

    return NextResponse.json({
      success: true,
      message: "Event category updated successfully.",
      data: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "An event category with this name already exists.",
        },
        { status: 409 },
      );
    }

    console.error("UPDATE EVENT CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update event category." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const category = await EventCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Event category not found." },
        { status: 404 },
      );
    }

    await category.deleteOne();

    return NextResponse.json({
      success: true,
      message: "Event category deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE EVENT CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete event category." },
      { status: 500 },
    );
  }
}
