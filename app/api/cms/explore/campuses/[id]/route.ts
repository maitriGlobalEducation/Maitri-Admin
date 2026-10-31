import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreCampus from "@/models/ExploreCampus";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

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

    const campus = await ExploreCampus.findByIdAndUpdate(
      id,
      { $set: { name, city, country, image } },
      { new: true, runValidators: true },
    );

    if (!campus) {
      return NextResponse.json(
        { success: false, message: "Campus not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true, campus });
  } catch (error) {
    console.error("PUT campus:", error);
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
