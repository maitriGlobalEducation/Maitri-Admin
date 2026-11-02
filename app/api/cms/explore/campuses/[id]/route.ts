import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreCampus from "@/models/ExploreCampus";
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
        { success: false, message: "Invalid campus ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();

    const name = cleanText(body.name);
    const city = cleanText(body.city);
    const country = cleanText(body.country);
    const image = validImage(body.image);

    if (!name || !city || !country || !image) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, city, country and a valid image are required.",
        },
        { status: 400 },
      );
    }

    const campus = await ExploreCampus.findById(id);

    if (!campus) {
      return NextResponse.json(
        { success: false, message: "Campus not found." },
        { status: 404 },
      );
    }

    // Preserve the existing slug unless a slug is explicitly provided.
    const slug = createSlug(
      body.slug !== undefined ? cleanText(body.slug) : campus.slug || name,
    );

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "A valid slug is required." },
        { status: 400 },
      );
    }

    const existingCampus = await ExploreCampus.findOne({
      slug,
      _id: { $ne: id },
    });

    if (existingCampus) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    campus.name = name;
    campus.slug = slug;
    campus.city = city;
    campus.country = country;
    campus.image = image;

    await campus.save();

    await revalidatePublicpage();

    return NextResponse.json({ success: true, campus });
  } catch (error) {
    console.error("PUT campus:", error);

    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update campus." },
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
        { success: false, message: "Invalid campus ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const campus = await ExploreCampus.findByIdAndDelete(id);

    if (!campus) {
      return NextResponse.json(
        { success: false, message: "Campus not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE campus:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete campus." },
      { status: 500 },
    );
  }
}
