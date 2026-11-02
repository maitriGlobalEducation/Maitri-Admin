import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreArea from "@/models/ExploreArea";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";
import { createSlug } from "@/lib/slug";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid area ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();
    const name = cleanText(body.name);
    const image = validImage(body.image);

    if (!name || !image) {
      return NextResponse.json(
        { success: false, message: "Name and a valid image are required." },
        { status: 400 },
      );
    }

    const currentArea = await ExploreArea.findById(id);

    if (!currentArea) {
      return NextResponse.json(
        { success: false, message: "Area not found." },
        { status: 404 },
      );
    }

    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? createSlug(body.slug)
        : currentArea.slug || createSlug(name);

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "A valid slug is required." },
        { status: 400 },
      );
    }

    const existingSlug = await ExploreArea.findOne({
      slug,
      _id: { $ne: id },
    }).lean();

    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: "An area with this slug already exists." },
        { status: 409 },
      );
    }

    currentArea.name = name;
    currentArea.slug = slug;
    currentArea.image = image;

    await currentArea.save();

    await revalidatePublicpage();

    return NextResponse.json({ success: true, area: currentArea });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "An area with this name or slug already exists.",
        },
        { status: 409 },
      );
    }

    console.error("PUT area:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update area." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid area ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const area = await ExploreArea.findByIdAndDelete(id);

    if (!area) {
      return NextResponse.json(
        { success: false, message: "Area not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE area:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete area." },
      { status: 500 },
    );
  }
}
